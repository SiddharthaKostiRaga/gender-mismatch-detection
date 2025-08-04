import pandas as pd
import os
from supabase import create_client, Client

def upload_gt_dataset():
    """Upload GT dataset to Supabase"""
    
    # Supabase configuration
    supabase_url = "https://fpplmfsrhxkvnwunlfdl.supabase.co"
    supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwcGxtZnNyaHhrdm53dW5sZmRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI5MDU0NywiZXhwIjoyMDY5ODY2NTQ3fQ.AsvxBdeJ7G58g745yANYT819Gxrr05v0X5W2V7cWqJo"
    
    # Initialize Supabase client
    supabase: Client = create_client(supabase_url, supabase_key)
    
    try:
        # Load the GT dataset
        print("Loading GT dataset...")
        df = pd.read_csv('GT_dataset_gender_mismatch.csv')
        
        # Select only the columns we need
        gt_data = df[['gender', 'findings', 'human_impression']].copy()
        
        # Remove rows with empty/null values
        gt_data = gt_data.dropna()
        
        print(f"Dataset loaded: {len(gt_data)} records")
        print(f"Gender distribution:")
        print(gt_data['gender'].value_counts())
        
        # Convert to list of dictionaries for Supabase
        records = gt_data.to_dict('records')
        
        # Upload to Supabase
        print("Uploading to Supabase...")
        result = supabase.table('gt_dataset').insert(records).execute()
        
        print(f"✅ Successfully uploaded {len(records)} records to Supabase")
        
        # Verify upload by counting records
        count_result = supabase.table('gt_dataset').select('*', count='exact').execute()
        print(f"📊 Total records in database: {count_result.count}")
        
        # Get unique gender values
        gender_result = supabase.table('gt_dataset').select('gender').execute()
        unique_genders = set([record['gender'] for record in gender_result.data])
        print(f"🎯 Unique gender values: {sorted(unique_genders)}")
        
    except Exception as e:
        print(f"❌ Error uploading dataset: {str(e)}")
        print("💡 Please run the SQL in database/create_gt_dataset.sql in Supabase SQL editor first")
        raise

if __name__ == "__main__":
    upload_gt_dataset() 