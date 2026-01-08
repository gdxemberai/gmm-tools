#!/usr/bin/env python3
"""
Merge multiple JSON sales data files into a single combined file.

This script reads 5 separate JSON files (set1.json through set5.json),
merges all arrays into a single array, and writes the combined data
to dummy_sales_data.json for use by the seeding script.
"""

import json
import os
import sys
from pathlib import Path


def main():
    """Main function to merge JSON files."""
    
    # Define the base directory (where this script is located)
    script_dir = Path(__file__).parent
    
    # Define input files
    input_files = [
        script_dir / "set1.json",
        script_dir / "set2.json",
        script_dir / "set3.json",
        script_dir / "set4.json",
        script_dir / "set5.json"
    ]
    
    # Define output file
    output_file = script_dir / "dummy_sales_data.json"
    
    print("=" * 60)
    print("JSON Data Merger")
    print("=" * 60)
    print()
    
    # Store all records
    all_records = []
    file_stats = []
    
    # Read each input file
    for input_file in input_files:
        try:
            # Check if file exists
            if not input_file.exists():
                print(f"❌ ERROR: File not found: {input_file.name}")
                sys.exit(1)
            
            # Read and parse JSON
            print(f"📖 Reading {input_file.name}...", end=" ")
            with open(input_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Validate that data is a list
            if not isinstance(data, list):
                print(f"\n❌ ERROR: {input_file.name} does not contain an array")
                sys.exit(1)
            
            # Add records to combined list
            record_count = len(data)
            all_records.extend(data)
            file_stats.append((input_file.name, record_count))
            
            print(f"✓ ({record_count} records)")
            
        except json.JSONDecodeError as e:
            print(f"\n❌ ERROR: Invalid JSON in {input_file.name}")
            print(f"   Details: {str(e)}")
            sys.exit(1)
        except Exception as e:
            print(f"\n❌ ERROR: Failed to read {input_file.name}")
            print(f"   Details: {str(e)}")
            sys.exit(1)
    
    print()
    print("-" * 60)
    print("Summary:")
    print("-" * 60)
    
    # Display statistics
    for filename, count in file_stats:
        print(f"  {filename:15} : {count:5} records")
    
    print("-" * 60)
    print(f"  {'TOTAL':15} : {len(all_records):5} records")
    print()
    
    # Write combined data to output file
    try:
        print(f"💾 Writing to {output_file.name}...", end=" ")
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(all_records, f, indent=2)
        print("✓")
        
    except Exception as e:
        print(f"\n❌ ERROR: Failed to write output file")
        print(f"   Details: {str(e)}")
        sys.exit(1)
    
    print()
    print("=" * 60)
    print(f"✅ SUCCESS: Merged {len(all_records)} records")
    print(f"📁 Output: {output_file.relative_to(script_dir.parent)}")
    print("=" * 60)
    print()


if __name__ == "__main__":
    main()
