# GT Dataset UI Implementation Guide

## **🎯 Project Overview**

Building a GT (Ground Truth) dataset analysis interface for the Gender Mismatch Detection System at [https://gender-mismatch-detection.netlify.app/](https://gender-mismatch-detection.netlify.app/).

## **📊 GT Dataset Analysis**

### **Dataset Statistics:**
- **Total Records**: 256
- **Gender Distribution**: 143 Female, 113 Male
- **Age Range**: 23-94 years
- **Columns**: 19 (focusing on gender, findings, human_impression)

### **Key Finding:**
The GT dataset contains **correct scenarios only** - all gender-anatomy alignments are appropriate, making it perfect for testing system accuracy and avoiding false positives.

## **🎨 UI Design Specification**

### **Layout Structure:**
```
┌─────────────────────────────────────────────────────────┐
│ 🎯 GT Dataset Analysis                                │
│                                                       │
│ Gender: [Dropdown ▼] (Optional)                      │
│ Findings: [Dropdown ▼] (Optional)                    │
│ Human Impression: [Dropdown ▼] (Optional)             │
│                                                       │
│ [🔍 Run Detection] (Disabled until 2+ selected)      │
│                                                       │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 📊 Comparative Analysis Results                    │
│ │ Gender vs Findings: ✅ No mismatch                │
│ │ Gender vs Impression: ✅ No mismatch               │
│ │ Overall: ✅ All combinations are correct           │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### **Dropdown Behavior:**

#### **1. Gender Dropdown:**
- **Source**: Extract unique values from GT dataset
- **Values**: `["Male", "Female", "Unknown", "Declined to Specify", etc.]`
- **Filtering**: Remove empty/null values

#### **2. Findings Dropdown:**
- **Source**: All 256 unique findings from GT dataset
- **Display**: Show truncated text (first 50-100 characters)
- **Values**: `["VISUALIZED PORTION OF CHESTLUNGS: Unremarkable...", "LIVER: Normal size. No lesions...", etc.]`

#### **3. Human Impression Dropdown:**
- **Source**: All 256 unique human impressions from GT dataset
- **Display**: Show truncated text (first 50-100 characters)
- **Values**: `["1. Fatty atrophy of the pancreatic head...", "1. No hydronephrosis.2. Cholelithiasis.", etc.]`

### **Selection Requirements:**
- **Minimum**: 2 columns must be selected
- **Maximum**: All 3 columns can be selected
- **Validation**: Disable "Run Detection" button until minimum requirement met

## **🔍 Analysis Strategy**

### **Separate Comparative Analysis:**
**NO TEXT MERGING** - Each combination analyzed independently:

#### **1. Gender vs Findings Analysis:**
```
Input: Gender + Findings only
API Call: findings_text as report_text
Analysis: Check for gender-specific terms in findings
```

#### **2. Gender vs Human Impression Analysis:**
```
Input: Gender + Human Impression only
API Call: human_impression_text as report_text
Analysis: Check for gender-specific terms in impression
```

#### **3. Gender vs Findings vs Human Impression Analysis:**
```
Input: All three selected
API Calls: 
- Gender vs Findings (separate call)
- Gender vs Human Impression (separate call)
Analysis: Combined results from both analyses
```

### **API Integration:**
- **Endpoint**: Use existing `/api/detect-mismatch`
- **Method**: POST
- **Payload**: 
```javascript
{
  "report_text": "selected_text_only",
  "patient_gender": "selected_gender",
  "patient_age": 50  // Default age
}
```

## **📊 Results Display**

### **Comprehensive Results (All Three Types):**

#### **A) Detection Results:**
```
✅ No mismatches detected
❌ High priority: "prostate" found in Female patient
❌ Medium priority: "uterine" found in Male patient
```

#### **B) Selected Data Analyzed:**
```
Gender: Male
Findings: "Prostate gland is enlarged measuring 6.4 x 5.4 x 7.2 cm..."
Human Impression: "Benign prostatic hyperplasia..."
```

#### **C) Processing Metrics:**
```
⏱️ Processing time: 1.2s
Keywords checked: 123
📋 Exclusion rules applied: 3
🎯 Priority level: None
```

### **Results Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ 📊 Analysis Results                                   │
│                                                       │
│ A) Detection Results:                                 │
│ ✅ No mismatches detected                             │
│                                                       │
│ B) Selected Data:                                     │
│ Gender: Male                                          │
│ Findings: "Prostate gland is enlarged..."             │
│ Impression: "Benign prostatic hyperplasia..."         │
│                                                       │
│ C) Processing Metrics:                                │
│ ⏱️ Processing time: 1.2s                             │
│ Keywords checked: 123                             │
│ 📋 Exclusion rules applied: 3                        │
└─────────────────────────────────────────────────────────┘
```

## **⚠️ Error Handling**

### **Validation Rules:**
1. **Empty Values**: Filter out from dropdowns
2. **Insufficient Selection**: Show "Please select at least 2 columns for analysis"
3. **API Failures**: Show "Analysis failed. Please try again."
4. **Network Issues**: Show "Connection error. Please check your internet."

### **User Experience:**
- **Button State**: Disabled until 2+ columns selected
- **Loading State**: Show spinner during API calls
- **Error Messages**: Clear, actionable feedback

## **🗄️ Database Schema**

### **GT Dataset Table:**
```sql
CREATE TABLE gt_dataset (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    gender VARCHAR(50),
    findings TEXT,
    human_impression TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Data Population:**
- **Source**: GT_dataset_gender_mismatch.csv
- **Columns**: gender, findings, human_impression
- **Filtering**: Remove empty/null values
- **Unique Extraction**: Extract unique gender values for dropdown

## **🚀 Implementation Steps**

### **Phase 1: Database Setup**
1. Create `gt_dataset` table in Supabase
2. Upload GT dataset (256 records)
3. Extract unique gender values
4. Test data accessibility

### **Phase 2: Backend API**
1. Create new endpoint for GT dataset analysis
2. Implement separate analysis logic
3. Add validation for minimum 2 columns
4. Test API functionality

### **Phase 3: Frontend UI**
1. Build new UI component with three dropdowns
2. Implement dropdown population logic
3. Add validation and error handling
4. Create results display component

### **Phase 4: Integration**
1. Connect frontend to backend API
2. Test complete workflow
3. Deploy to Netlify
4. Validate end-to-end functionality

## **🎯 Success Criteria**

### **Functional Requirements:**
- ✅ User can select 2-3 columns from dropdowns
- ✅ System validates minimum selection requirement
- ✅ API performs separate comparative analysis
- ✅ Results display comprehensive information
- ✅ Error handling works correctly

### **Technical Requirements:**
- ✅ Database stores GT dataset correctly
- ✅ API responds within 5 seconds
- ✅ UI is responsive and user-friendly
- ✅ No false positives on correct scenarios

### **POC Goals:**
- ✅ Demonstrate GT dataset analysis capability
- ✅ Show separate comparative analysis approach
- ✅ Validate system accuracy with real data
- ✅ Provide comprehensive results display

---

**Note**: This implementation follows the customer reference document requirements while focusing on the GT dataset analysis feature as a POC demonstration. 