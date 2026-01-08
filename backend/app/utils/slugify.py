"""
Slugify utility for converting text to URL-friendly slugs.
Used for creating consistent IDs from player names, brands, and variations.
"""

import re
from typing import Optional


def slugify(text: Optional[str]) -> str:
    """
    Convert text to a URL-friendly slug.
    
    Converts to lowercase, replaces spaces with hyphens, and removes special
    characters (keeping only alphanumeric characters and hyphens).
    
    Args:
        text: The text to slugify (can be None or empty)
        
    Returns:
        str: Slugified text (lowercase, kebab-case, alphanumeric + hyphens only)
        
    Examples:
        >>> slugify("Michael Jordan")
        'michael-jordan'
        >>> slugify("Ken Griffey Jr.")
        'ken-griffey-jr'
        >>> slugify("Topps Chrome")
        'topps-chrome'
        >>> slugify("O'Neal")
        'oneal'
        >>> slugify("  Multiple   Spaces  ")
        'multiple-spaces'
        >>> slugify("")
        ''
        >>> slugify(None)
        ''
    """
    # Handle None or empty string
    if not text:
        return ""
    
    # Convert to lowercase
    slug = text.lower()
    
    # Replace spaces (including multiple spaces) with a single hyphen
    slug = re.sub(r'\s+', '-', slug)
    
    # Remove all characters except alphanumeric and hyphens
    # This handles special characters like apostrophes, periods, etc.
    slug = re.sub(r'[^a-z0-9-]', '', slug)
    
    # Remove multiple consecutive hyphens
    slug = re.sub(r'-+', '-', slug)
    
    # Remove leading and trailing hyphens
    slug = slug.strip('-')
    
    return slug
