# Enhanced Hate Speech & Discriminatory Content Moderation

## Overview
The moderation system now includes comprehensive detection for hate speech, slurs, and discriminatory language targeting protected groups.

## Categories Covered

### 1. Homophobic Content
- Direct slurs and derogatory terms
- Context-aware patterns like "this is gay", "that's so gay" (when used pejoratively)
- Phrases like "no homo"

### 2. Racial Hate Speech
- Racial slurs (all major variants)
- Derogatory phrases targeting race/ethnicity
- Discriminatory generalization patterns (e.g., "all [race] are...")
- Deportation/xenophobic language

### 3. Transphobic Content
- Transphobic slurs
- Misgendering patterns
- Derogatory terms

### 4. Ableist Language
- Ableist slurs
- Derogatory terms for disabilities

### 5. Misogynistic Language
- Gendered slurs
- Derogatory terms targeting women

## Detection Methods

### Word-Based Detection
The system maintains a comprehensive list of known slurs and hate speech terms that are automatically flagged.

### Context-Aware Patterns
Beyond simple word matching, the system detects:
- Phrases using identity terms in derogatory contexts
- Discriminatory generalizations
- Hate speech patterns with qualifying language

### Leet-Speak & Obfuscation
Detects attempts to bypass filters using:
- Special characters (e.g., "f@gg0t")
- Letter substitutions
- Common obfuscation techniques

## Examples of Flagged Content

### ✅ Will Be Flagged
- "this is gay" (derogatory usage)
- "that's so gay"
- Racial slurs in any form
- "all [group] are [negative trait]"
- "go back to [country/region]"
- Slurs with special characters (e.g., "f@g", "n!gger")

### ❌ Won't Be Flagged (Legitimate Usage)
- Academic or educational discussions citing terms for context
- LGBTQ+ individuals self-identifying (would need context detection)
- Reclaimed usage in appropriate contexts

**Note:** The current system is strict to protect community members. Edge cases may need manual review by admins.

## Admin Review Process

When hate speech is detected:
1. Comment is created with `status: "pending_review"`
2. Auto-report is generated with violation details
3. Comment is hidden from public view
4. Admin reviews in moderation panel
5. Admin decides to:
   - **Remove Comment**: Permanently hide the hate speech
   - **Publish Comment**: If it was a false positive (rare)

## Testing the Enhanced Moderation

Test with these phrases (they should all be auto-flagged):

### Homophobic
```
"this is gay"
"that's so gay"
"no homo"
```

### Racial
```
[any racial slur]
"go back to your country"
"all [racial group] are [negative]"
```

### General Hate Speech
```
[any slur from the protected categories]
```

## Customization

To add more terms or patterns, edit `/src/lib/moderation/profanity.ts`:

```typescript
// Add to customBadWords array
const customBadWords: string[] = [
  'your-word-here',
]

// Add to derogatorPatterns array
const derogatorPatterns = [
  /your-pattern-here/i,
]
```

## Important Notes

### False Positives
Some legitimate content may be flagged:
- Academic discussions about discrimination
- Quoting problematic content to criticize it
- Reclaimed language by community members

**Solution:** Admin review allows publishing false positives

### False Negatives
Some hate speech may evade detection:
- New slang or coded language
- Contextual hate that reads as neutral text
- Sophisticated obfuscation

**Solution:** User reporting catches what automated moderation misses

## Privacy & Data Handling

- Flagged comments are stored with `status: "pending_review"`
- Violation types are recorded in auto-reports
- Only admins can see flagged content
- User data is protected per privacy policy

## Compliance

This moderation system helps comply with:
- Platform content policies
- Anti-discrimination laws
- Community safety standards
- Terms of service

## Continuous Improvement

The moderation rules should be updated regularly based on:
- New hate speech patterns emerging
- Community feedback
- Admin review patterns
- False positive/negative rates

## Support Resources

For users who encounter hate speech:
- Report button for manual review
- Admin moderation within 24-48 hours
- Clear community guidelines
- Appeal process for false positives

