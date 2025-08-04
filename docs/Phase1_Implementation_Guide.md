# Gender Mismatch Detection System - Phase 1 Implementation Guide

## Table of Contents
1. [System Overview](#system-overview)
2. [Sub-Phase 1A: Core Infrastructure](#sub-phase-1a-core-infrastructure)
3. [Sub-Phase 1B: Keyword Library Implementation](#sub-phase-1b-keyword-library-implementation)
4. [Sub-Phase 1C: Detection Logic](#sub-phase-1c-detection-logic)
5. [Sub-Phase 1D: Exclusion Rules](#sub-phase-1d-exclusion-rules)
6. [Sub-Phase 1E: Alert System](#sub-phase-1e-alert-system)
7. [Sub-Phase 1F: Quality Assurance](#sub-phase-1f-quality-assurance)
8. [Testing & Validation](#testing--validation)
9. [Deployment Checklist](#deployment-checklist)

## System Overview

### Purpose
Automated detection of gender mismatches in radiology reports using keyword-based pattern recognition.

### Key Features
- Pre-defined keyword libraries for male/female specific terms
- Age-based detection logic
- Smart exclusion rules
- Priority-based alert system
- Quality metrics tracking

### Business Rules Summary
- **Female patients**: Flag ALL male-specific terms
- **Male patients ≥8 years**: Flag ALL female-specific terms + pregnancy terms
- **Male patients <8 years**: Flag only non-pregnancy female terms
- **Unknown gender**: Skip processing

---

## Sub-Phase 1A: Core Infrastructure

### 1.1 Database Schema

```sql
-- Keywords table
CREATE TABLE gender_keywords (
    id SERIAL PRIMARY KEY,
    keyword VARCHAR(100) NOT NULL,
    gender_type VARCHAR(10) NOT NULL, -- 'male', 'female'
    category VARCHAR(50) NOT NULL, -- 'body_part', 'finding', 'lab_test'
    subcategory VARCHAR(50), -- 'pregnancy_related', 'non_pregnancy'
    pregnancy_related BOOLEAN DEFAULT FALSE,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exclusion patterns table
CREATE TABLE gender_exclusions (
    id SERIAL PRIMARY KEY,
    pattern_name VARCHAR(100) NOT NULL,
    regex_pattern TEXT NOT NULL,
    context_type VARCHAR(50) NOT NULL, -- 'healthcare_provider', 'communication'
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Detection rules table
CREATE TABLE gender_rules (
    id SERIAL PRIMARY KEY,
    rule_name VARCHAR(100) NOT NULL,
    patient_gender VARCHAR(10) NOT NULL,
    min_age INTEGER,
    max_age INTEGER,
    pregnancy_terms_included BOOLEAN DEFAULT FALSE,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 1.2 API Structure

```python
# API Endpoint
POST /api/gender-mismatch/detect

# Request Body
{
    "report_text": "string",
    "patient_gender": "Male|Female|Unknown",
    "patient_age": number,
    "report_id": "string (optional)"
}

# Response Body
{
    "mismatches": [
        {
            "keyword": "string",
            "category": "string",
            "priority": "High|Medium",
            "context": "string",
            "line_number": number,
            "confidence_score": number
        }
    ],
    "processing_skipped": boolean,
    "skip_reason": "string",
    "processing_time_ms": number,
    "total_keywords_checked": number
}
```

### 1.3 Configuration Management

```python
# config.py
class GenderMismatchConfig:
    # Age thresholds
    MALE_AGE_THRESHOLD = 8
    
    # Processing settings
    MAX_CONTEXT_CHARS = 50
    MIN_CONFIDENCE_SCORE = 0.7
    
    # Alert priorities
    PRIORITY_HIGH = "High"
    PRIORITY_MEDIUM = "Medium"
    
    # Gender types
    GENDER_MALE = "Male"
    GENDER_FEMALE = "Female"
    GENDER_UNKNOWN = "Unknown"
```

---

## Sub-Phase 1B: Keyword Library Implementation

### 2.1 Male-Specific Keywords

```python
# male_keywords.py
MALE_BODY_PARTS = [
    "prostate", "prostatic", "testis", "testes", "testicular",
    "testicle", "testicles", "scrotum", "scrotal", "penis",
    "penile", "glans", "prepuce", "foreskin", "epididymis",
    "epididymal", "vas deferens", "seminal vesicle",
    "seminal vesicles", "spermatic cord"
]

MALE_CLINICAL_FINDINGS = [
    "BPH", "prostatitis", "cryptorchidism", "hydrocele",
    "varicocele", "epididymitis", "orchitis", "priapism",
    "gynecomastia"
]

MALE_LAB_TESTS = [
    "PSA", "prostate specific antigen", "prostate-specific antigen",
    "free PSA", "PSA ratio", "semen analysis", "sperm count",
    "sperm concentration", "sperm motility", "sperm morphology"
]
```

### 2.2 Female-Specific Keywords

```python
# female_keywords.py
FEMALE_NON_PREGNANCY_BODY_PARTS = [
    "uterus", "uterine", "ovary", "ovaries", "ovarian",
    "fallopian tube", "fallopian tubes", "cervix", "cervical",
    "vagina", "vaginal", "vulva", "vulvar", "labia",
    "clitoris", "endometrium", "endometrial", "myometrium",
    "myometrial", "adnexa", "adnexal"
]

FEMALE_PREGNANCY_BODY_PARTS = [
    "placenta", "placental", "amniotic", "umbilical cord",
    "fetal", "fetus"
]

FEMALE_NON_PREGNANCY_FINDINGS = [
    "PCOS", "endometriosis", "adenomyosis", "PID",
    "vaginismus", "vulvodynia"
]

FEMALE_PREGNANCY_FINDINGS = [
    "pregnant", "pregnancy", "gravid", "gravida", "gestation",
    "gestational", "trimester", "prenatal", "antenatal",
    "obstetric", "obstetrical", "conception", "fertilization",
    "implantation", "menstrual", "menstruation", "menopause",
    "menopausal", "ovulation", "gynecologic", "gynecological",
    "preeclampsia", "eclampsia", "miscarriage", "abortion",
    "IUGR", "oligohydramnios", "polyhydramnios"
]

FEMALE_LAB_TESTS = [
    # Non-pregnancy
    "pap smear", "pap test", "cervical cytology", "HPV test",
    "mammography", "mammogram",
    # Pregnancy
    "beta-hCG", "beta hCG", "human chorionic gonadotropin",
    "hCG", "AFP", "alpha-fetoprotein", "PAPP-A",
    "pregnancy-associated plasma protein", "triple screen",
    "quad screen", "first trimester screen", "second trimester screen",
    "glucose tolerance test", "GCT", "OGTT", "group B strep",
    "GBS culture"
]
```

### 2.3 Exception Keywords (Male <8 years)

```python
# exception_keywords.py
MALE_UNDER_8_EXCEPTIONS = [
    "breech", "vertex", "forceps", "cesarean", "c-section",
    "episiotomy"
]
```

### 2.4 Patient Reference Keywords

```python
# patient_reference_keywords.py
PATIENT_REFERENCE_KEYWORDS = [
    "female", "male", "she", "her", "hers", "he", "him", "his",
    "woman", "man", "girl", "boy"
]

# Patient reference patterns for context analysis
PATIENT_REFERENCE_PATTERNS = {
    "female_references": ["female", "she", "her", "hers", "woman", "girl"],
    "male_references": ["male", "he", "him", "his", "man", "boy"]
}
```

---

## Sub-Phase 1C: Detection Logic

### 3.1 Main Processing Workflow

```python
# detection_engine.py
class GenderMismatchDetector:
    def __init__(self, config):
        self.config = config
        self.keyword_library = KeywordLibrary()
        self.exclusion_rules = ExclusionRules()
    
    def detect_mismatches(self, report_text, patient_gender, patient_age):
        # Step 1: Validate input
        if patient_gender == self.config.GENDER_UNKNOWN:
            return self._create_skip_response("Unknown gender")
        
        # Step 2: Extract patient age
        if patient_age is None:
            return self._create_skip_response("Missing patient age")
        
        # Step 3: Apply detection logic based on gender and age
        mismatches = self._apply_detection_rules(
            report_text, patient_gender, patient_age
        )
        
        # Step 4: Apply exclusion rules
        filtered_mismatches = self._apply_exclusion_rules(
            mismatches, report_text
        )
        
        # Step 5: Generate response
        return self._create_response(filtered_mismatches)
    
    def _apply_detection_rules(self, text, gender, age):
        mismatches = []
        
        if gender == self.config.GENDER_FEMALE:
            # Female patients: flag ALL male keywords
            mismatches.extend(self._find_male_keywords(text))
            
        elif gender == self.config.GENDER_MALE:
            if age >= self.config.MALE_AGE_THRESHOLD:
                # Male ≥8: flag ALL female keywords + pregnancy
                mismatches.extend(self._find_female_keywords(text, include_pregnancy=True))
            else:
                # Male <8: flag only non-pregnancy female keywords
                mismatches.extend(self._find_female_keywords(text, include_pregnancy=False))
        
        return mismatches
```

### 3.2 Keyword Matching Functions

```python
# keyword_matcher.py
class KeywordMatcher:
    def __init__(self):
        self.male_pattern = self._compile_male_pattern()
        self.female_non_pregnancy_pattern = self._compile_female_non_pregnancy_pattern()
        self.female_pregnancy_pattern = self._compile_female_pregnancy_pattern()
        self.exception_pattern = self._compile_exception_pattern()
    
    def find_male_keywords(self, text):
        matches = self.male_pattern.finditer(text)
        return [self._create_match(match, "male") for match in matches]
    
    def find_female_keywords(self, text, include_pregnancy=True):
        matches = []
        
        # Always include non-pregnancy terms
        non_pregnancy_matches = self.female_non_pregnancy_pattern.finditer(text)
        matches.extend([self._create_match(match, "female_non_pregnancy") 
                      for match in non_pregnancy_matches])
        
        # Include pregnancy terms if requested
        if include_pregnancy:
            pregnancy_matches = self.female_pregnancy_pattern.finditer(text)
            matches.extend([self._create_match(match, "female_pregnancy") 
                          for match in pregnancy_matches])
        
        return matches
    
    def _create_match(self, match, category):
        return {
            "keyword": match.group(),
            "category": category,
            "start_pos": match.start(),
            "end_pos": match.end(),
            "context": self._extract_context(match)
        }
```

---

## Sub-Phase 1D: Exclusion Rules

### 4.1 Healthcare Provider Context

```python
# exclusion_rules.py
class ExclusionRules:
    def __init__(self):
        # Healthcare Provider Context (NO MISMATCH)
        # Trigger Words Before Gender Reference
        self.provider_trigger_words = [
            "physician", "doctor", "dr", "nurse", "provider", "technician",
            "radiologist", "clinician", "staff", "attending", "resident", "intern"
        ]
        
        self.provider_pattern = re.compile(
            r'(?:physician|doctor|dr\.?|nurse|provider|technician|'
            r'radiologist|clinician|staff|attending|resident|intern)\s+'
            r'.{0,50}\b(he|she|his|her|him|male|female)\b',
            re.IGNORECASE
        )
        
        # Communication Context (NO MISMATCH)
        # Communication Verbs + Patient/Family
        self.communication_verbs = [
            "spoke", "talked", "discussed", "communicated", "contacted",
            "called", "informed", "told", "asked", "explained", "consulted"
        ]
        
        self.communication_pattern = re.compile(
            r'(?:spoke|talked|discussed|communicated|contacted|called|'
            r'informed|told|asked|explained|consulted)\s+(?:with\s+)?'
            r'(?:the\s+)?(?:patient|family|mother|father|parent|guardian)\s+'
            r'.{0,50}\b(he|she|his|her|him|male|female)\b',
            re.IGNORECASE
        )
    
    def apply_exclusions(self, mismatches, text):
        filtered_mismatches = []
        
        for mismatch in mismatches:
            if not self._is_excluded(mismatch, text):
                filtered_mismatches.append(mismatch)
        
        return filtered_mismatches
    
    def _is_excluded(self, mismatch, text):
        # Check healthcare provider context
        if self.provider_pattern.search(text):
            return True
        
        # Check communication context
        if self.communication_pattern.search(text):
            return True
        
        # Check patient reference context
        if self._is_patient_reference_context(text):
            return True
        
        return False
    
    def _is_patient_reference_context(self, text):
        """Check if gender references are in patient context rather than clinical findings"""
        text_lower = text.lower()
        
        # Look for patient reference keywords near gender terms
        patient_ref_pattern = re.compile(
            r'\b(he|she|his|her|him|male|female|woman|man|girl|boy)\b',
            re.IGNORECASE
        )
        
        gender_matches = patient_ref_pattern.finditer(text)
        for match in gender_matches:
            # Check if this is a patient reference, not a clinical finding
            context_start = max(0, match.start() - 100)
            context_end = min(len(text), match.end() + 100)
            context = text[context_start:context_end].lower()
            
            # If context contains patient reference indicators, exclude
            if any(word in context for word in ["patient", "family", "mother", "father", "parent"]):
                return True
        
        return False
```

### 4.2 Exception Handling for Male <8

```python
# exception_handler.py
class ExceptionHandler:
    def __init__(self):
        self.exception_pattern = re.compile(
            r'\b(breech|vertex|forceps|cesarean|c-section|episiotomy)\b',
            re.IGNORECASE
        )
    
    def filter_pregnancy_exceptions(self, mismatches, patient_age, patient_gender):
        if patient_gender == "Male" and patient_age < 8:
            return [m for m in mismatches 
                   if not self.exception_pattern.search(m["keyword"])]
        return mismatches
```

---

## Sub-Phase 1E: Alert System

### 5.1 Priority Classification

```python
# alert_classifier.py
class AlertClassifier:
    def __init__(self, config):
        self.config = config
    
    def classify_priority(self, mismatch, patient_gender, patient_age):
        # High Priority: Direct gender mismatches
        if self._is_high_priority(mismatch, patient_gender, patient_age):
            return self.config.PRIORITY_HIGH
        
        # Medium Priority: Patient reference mismatches
        return self.config.PRIORITY_MEDIUM
    
    def _is_high_priority(self, mismatch, gender, age):
        # Female patient + male keywords
        if gender == "Female" and "male" in mismatch["category"]:
            return True
        
        # Male ≥8 + female keywords
        if gender == "Male" and age >= 8 and "female" in mismatch["category"]:
            return True
        
        # Male <8 + non-pregnancy female keywords
        if gender == "Male" and age < 8 and mismatch["category"] == "female_non_pregnancy":
            return True
        
        return False
```

### 5.2 Alert Generation

```python
# alert_generator.py
class AlertGenerator:
    def __init__(self, classifier):
        self.classifier = classifier
    
    def generate_alerts(self, mismatches, patient_gender, patient_age):
        alerts = []
        
        for mismatch in mismatches:
            priority = self.classifier.classify_priority(
                mismatch, patient_gender, patient_age
            )
            
            alert = {
                "keyword": mismatch["keyword"],
                "category": mismatch["category"],
                "priority": priority,
                "context": mismatch["context"],
                "line_number": self._get_line_number(mismatch),
                "confidence_score": self._calculate_confidence(mismatch)
            }
            
            alerts.append(alert)
        
        return alerts
```

---

## Sub-Phase 1F: Quality Assurance

### 6.1 Performance Metrics

```python
# metrics_tracker.py
class MetricsTracker:
    def __init__(self):
        self.metrics = {
            "total_reports_processed": 0,
            "total_alerts_generated": 0,
            "high_priority_alerts": 0,
            "medium_priority_alerts": 0,
            "processing_times": [],
            "false_positives": 0,
            "false_negatives": 0
        }
    
    def track_processing(self, report_data, results):
        self.metrics["total_reports_processed"] += 1
        self.metrics["total_alerts_generated"] += len(results["mismatches"])
        
        for alert in results["mismatches"]:
            if alert["priority"] == "High":
                self.metrics["high_priority_alerts"] += 1
            else:
                self.metrics["medium_priority_alerts"] += 1
        
        self.metrics["processing_times"].append(results["processing_time_ms"])
    
    def get_performance_summary(self):
        avg_processing_time = sum(self.metrics["processing_times"]) / len(self.metrics["processing_times"])
        
        return {
            "total_reports": self.metrics["total_reports_processed"],
            "total_alerts": self.metrics["total_alerts_generated"],
            "high_priority_rate": self.metrics["high_priority_alerts"] / max(self.metrics["total_alerts_generated"], 1),
            "avg_processing_time_ms": avg_processing_time,
            "alerts_per_report": self.metrics["total_alerts_generated"] / max(self.metrics["total_reports_processed"], 1)
        }
```

### 6.2 Validation Framework

```python
# validation_framework.py
class ValidationFramework:
    def __init__(self):
        self.test_cases = self._load_test_cases()
    
    def run_validation_tests(self):
        results = {
            "passed": 0,
            "failed": 0,
            "test_cases": []
        }
        
        for test_case in self.test_cases:
            result = self._run_single_test(test_case)
            results["test_cases"].append(result)
            
            if result["passed"]:
                results["passed"] += 1
            else:
                results["failed"] += 1
        
        return results
    
    def _load_test_cases(self):
        return [
            {
                "name": "Female patient with male keywords",
                "report_text": "Patient has prostate enlargement",
                "patient_gender": "Female",
                "patient_age": 45,
                "expected_alerts": 1,
                "expected_keyword": "prostate"
            },
            {
                "name": "Male ≥8 with female keywords",
                "report_text": "Patient has uterine fibroids",
                "patient_gender": "Male",
                "patient_age": 30,
                "expected_alerts": 1,
                "expected_keyword": "uterine"
            },
            {
                "name": "Male <8 with pregnancy keywords (should not alert)",
                "report_text": "Mother is pregnant with breech presentation",
                "patient_gender": "Male",
                "patient_age": 5,
                "expected_alerts": 0
            },
            {
                "name": "Healthcare provider context (should not alert)",
                "report_text": "The physician noted that she has normal findings",
                "patient_gender": "Male",
                "patient_age": 30,
                "expected_alerts": 0
            },
            {
                "name": "Communication context (should not alert)",
                "report_text": "Spoke with the patient's mother who said he was feeling better",
                "patient_gender": "Female",
                "patient_age": 25,
                "expected_alerts": 0
            },
            {
                "name": "Patient reference context (should not alert)",
                "report_text": "The patient, a 45-year-old female, has normal findings",
                "patient_gender": "Male",
                "patient_age": 30,
                "expected_alerts": 0
            }
        ]
```

---

## Testing & Validation

### Test Cases by Category

#### 1. Gender Detection Tests
- Female patient with male anatomical terms
- Male patient with female anatomical terms
- Unknown gender (should skip processing)

#### 2. Age-Based Logic Tests
- Male ≥8 with pregnancy terms
- Male <8 with pregnancy terms (should not alert)
- Male <8 with non-pregnancy female terms

#### 3. Exclusion Rule Tests
- Healthcare provider context
- Communication context
- Family member references
- Patient reference keywords (he, she, his, her, etc.)
- Provider trigger words (physician, doctor, nurse, etc.)
- Communication verbs (spoke, discussed, informed, etc.)

#### 4. Performance Tests
- Large report processing
- Multiple keyword matches
- Processing time benchmarks

### Validation Metrics

#### Accuracy Metrics
- **Precision**: Correct alerts / Total alerts
- **Recall**: Correct alerts / Total actual mismatches
- **F1-Score**: Harmonic mean of precision and recall

#### Performance Metrics
- **Processing Time**: Average time per report
- **Throughput**: Reports processed per minute
- **Memory Usage**: Peak memory consumption

---

## Deployment Checklist

### Pre-Deployment
- [ ] Database schema created and populated
- [ ] Keyword libraries loaded and validated
- [ ] Exclusion rules tested
- [ ] API endpoints configured
- [ ] Performance benchmarks established

### Deployment Steps
1. **Database Setup**
   - Create tables
   - Load keyword data
   - Configure exclusion patterns

2. **API Deployment**
   - Deploy detection service
   - Configure load balancing
   - Set up monitoring

3. **Integration Testing**
   - Test with sample reports
   - Validate alert accuracy
   - Performance testing

4. **Production Rollout**
   - Gradual rollout to subset of reports
   - Monitor metrics and alerts
   - Full deployment after validation

### Post-Deployment Monitoring
- [ ] Alert volume monitoring
- [ ] False positive rate tracking
- [ ] Processing time monitoring
- [ ] User feedback collection
- [ ] Performance optimization

---

## Success Criteria

### Technical Success
- Processing time < 2 seconds per report
- False positive rate < 5%
- System uptime > 99.9%
- Alert accuracy > 95%

### Business Success
- Reduction in manual review time
- Improved error detection rate
- User satisfaction > 4.0/5.0
- Cost savings in quality assurance

### Quality Metrics
- A/B testing with AI LLM shows > 90% agreement
- Alert fatigue rate < 10%
- Resolution time for alerts < 24 hours
- Continuous improvement based on feedback

---

*This implementation guide provides a comprehensive roadmap for Phase 1 deployment. Each sub-phase can be implemented independently and tested thoroughly before moving to the next phase.* 