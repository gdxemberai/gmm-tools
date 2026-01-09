"""
OpenAI service for parsing eBay listing titles using GPT-4o-mini.
Extracts structured card data from unstructured listing text.
"""

import os
import json
import logging
from typing import Optional, Dict, Any
from pathlib import Path
from openai import AsyncOpenAI
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

# Initialize OpenAI client
openai_client: Optional[AsyncOpenAI] = None


class ParsedCardData(BaseModel):
    """Structured card data extracted from listing title."""
    player_name: str
    year: Optional[int] = None
    brand: str
    card_number: Optional[str] = None
    card_type: Optional[str] = None
    variation: Optional[str] = None
    serial_numbered: Optional[int] = None
    
    is_rookie: bool = False
    is_prospect: bool = False
    is_first_bowman: bool = False
    
    is_autograph: bool = False
    has_patch: bool = False
    
    is_graded: bool = False
    grading_company: Optional[str] = None
    grade: Optional[float] = None
    has_perfect_subgrade: bool = False
    
    is_reprint: bool = False
    is_redemption: bool = False
    
    sport: Optional[str] = None
    confidence: str = "medium"
    warnings: list[str] = Field(default_factory=list)


def init_openai(api_key: Optional[str] = None) -> None:
    """
    Initialize OpenAI client.
    
    Args:
        api_key: OpenAI API key (if None, reads from OPENAI_API_KEY env var)
        
    Raises:
        ValueError: If API key is not provided
    """
    global openai_client
    
    key = api_key or os.getenv("OPENAI_API_KEY")
    if not key:
        raise ValueError("OpenAI API key not provided. Set OPENAI_API_KEY environment variable.")
    
    openai_client = AsyncOpenAI(api_key=key)
    logger.info("✓ OpenAI client initialized")


def get_openai_client() -> AsyncOpenAI:
    """
    Get the OpenAI client instance.
    
    Returns:
        AsyncOpenAI: Active OpenAI client
        
    Raises:
        RuntimeError: If OpenAI client is not initialized
    """
    if openai_client is None:
        raise RuntimeError("OpenAI client not initialized. Call init_openai() first.")
    return openai_client


def load_comprehensive_prompt() -> str:
    """
    Load the comprehensive parsing prompt from markdown file.
    
    Returns:
        str: Complete prompt text
        
    Raises:
        FileNotFoundError: If prompt file doesn't exist
    """
    # Get the backend directory (parent of app directory)
    backend_dir = Path(__file__).parent.parent.parent
    prompt_path = backend_dir / "comprehensive_prompt.md"
    
    logger.info(f"Looking for comprehensive_prompt.md at: {prompt_path}")
    logger.info(f"Current file location: {Path(__file__)}")
    logger.info(f"Backend directory: {backend_dir}")
    logger.info(f"Prompt path exists: {prompt_path.exists()}")
    
    # List files in backend directory for debugging
    if backend_dir.exists():
        logger.info(f"Files in backend directory: {list(backend_dir.iterdir())}")
    
    if not prompt_path.exists():
        raise FileNotFoundError(f"Comprehensive prompt not found at: {prompt_path}")
    
    with open(prompt_path, 'r', encoding='utf-8') as f:
        return f.read()


async def parse_listing_title(title: str) -> ParsedCardData:
    """
    Parse an eBay listing title using OpenAI GPT-4o-mini.
    
    Args:
        title: eBay listing title to parse
        
    Returns:
        ParsedCardData: Structured card data extracted from title
        
    Raises:
        Exception: If OpenAI API call fails
        
    Example:
        >>> data = await parse_listing_title("2023 Topps Chrome Wembanyama PSA 10")
        >>> print(data.player_name)
        'Victor Wembanyama'
    """
    try:
        client = get_openai_client()
        
        # Load the comprehensive prompt
        base_prompt = load_comprehensive_prompt()
        
        # Append the listing title to parse
        full_prompt = f"{base_prompt}\n\n{title}"
        
        logger.info(f"Parsing listing: {title}")
        
        # Call OpenAI API
        response = await client.chat.completions.create(
            model="gpt-5-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert sports card listing parser. Return ONLY valid JSON, no explanations or markdown formatting."
                },
                {
                    "role": "user",
                    "content": full_prompt
                }
            ],
            # temperature=0.1,  # Low temperature for consistent parsing
            max_completion_tokens=1000,
            response_format={"type": "json_object"}  # Ensure JSON response
        )
        
        # Extract the response content
        content = response.choices[0].message.content
        
        if not content:
            raise ValueError("Empty response from OpenAI")
        
        # Parse JSON response
        parsed_json = json.loads(content)
        
        # Validate and convert to Pydantic model
        card_data = ParsedCardData(**parsed_json)
        
        logger.info(f"Successfully parsed: {card_data.player_name} - {card_data.brand} ({card_data.year})")
        
        return card_data
        
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON response: {e}")
        logger.error(f"Response content: {content}")
        raise ValueError(f"Invalid JSON response from OpenAI: {e}")
        
    except Exception as e:
        logger.error(f"Error parsing listing title: {e}")
        raise


async def parse_listing_title_with_retry(
    title: str,
    max_retries: int = 2
) -> ParsedCardData:
    """
    Parse listing title with retry logic for transient failures.
    
    Args:
        title: eBay listing title to parse
        max_retries: Maximum number of retry attempts
        
    Returns:
        ParsedCardData: Structured card data
        
    Raises:
        Exception: If all retry attempts fail
    """
    last_error = None
    
    for attempt in range(max_retries + 1):
        try:
            return await parse_listing_title(title)
        except Exception as e:
            last_error = e
            if attempt < max_retries:
                logger.warning(f"Parse attempt {attempt + 1} failed, retrying... Error: {e}")
            else:
                logger.error(f"All {max_retries + 1} parse attempts failed")
    
    raise last_error


def extract_slugifiable_fields(parsed_data: ParsedCardData) -> Dict[str, str]:
    """
    Extract fields that need to be slugified for database queries.
    
    Args:
        parsed_data: Parsed card data from OpenAI
        
    Returns:
        Dict[str, str]: Dictionary with original field values
        
    Example:
        >>> data = ParsedCardData(player_name="Michael Jordan", brand="Topps Chrome", variation="Refractor")
        >>> extract_slugifiable_fields(data)
        {'player_name': 'Michael Jordan', 'brand': 'Topps Chrome', 'variation': 'Refractor'}
    """
    return {
        "player_name": parsed_data.player_name,
        "brand": parsed_data.brand,
        "variation": parsed_data.variation or "Base",
    }
