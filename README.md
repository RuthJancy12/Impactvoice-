# 🚨 ImpactVoice – AI-Powered Civic Issue Reporting & Municipal Dispatch System

ImpactVoice is an AI-powered civic issue reporting and municipal dispatch platform designed to connect citizens with the appropriate government departments and field teams.

Citizens can report civic problems either through a **manual reporting form** or using an **AI Voice reporting system**. The platform processes the complaint, identifies important information such as issue category, location and priority, and sends it to the **Admin Console** for verification and dispatch.

The Admin Console acts as the **central coordination center**, connecting citizen complaints with the appropriate municipal department and field dispatch team.

---

## 🎯 Problem Statement

Citizens often face difficulties when reporting civic problems such as:

- 💧 Water leakage
- 🛣️ Road damage
- 💡 Street light failures
- 🗑️ Garbage accumulation
- 🌧️ Drainage problems
- ⚡ Electricity issues
- 🌳 Other public infrastructure problems

Traditional complaint systems may involve manual processes, unclear department routing, delayed responses, and poor visibility into complaint status.

ImpactVoice provides a centralized digital platform for reporting, routing, dispatching, and tracking civic issues.

---

## 💡 Solution

ImpactVoice provides an end-to-end civic complaint management system.

### Citizen Side

Citizens can:

- Submit complaints manually
- Report issues using AI Voice
- Upload photo evidence
- Provide location details
- Select issue category
- Set priority level
- Track complaint status
- Receive status notifications

### AI Processing

The AI Voice system:

1. Captures the citizen's voice
2. Converts speech into text using OpenAI Whisper
3. Extracts relevant complaint information using Gemini AI
4. Identifies issue details such as:
   - Category
   - Location
   - Description
   - Priority
5. Prepares the complaint for administrative verification

### Admin Console

The Admin Console acts as the **central control center**.

Administrators can:

- Review incoming complaints
- Verify complaint information
- Check issue category
- Check location and priority
- Assign the appropriate department
- Dispatch field teams
- Monitor ongoing complaints
- Track field team updates
- Update complaint status
- Monitor resolved issues

### Field Dispatch Team

The assigned field team can:

- Receive assigned complaints
- Inspect the reported location
- Perform repair or maintenance work
- Update work progress
- Mark the issue as resolved

---

## 🔄 System Workflow



Citizen
   │
   ├── Manual Report
   │
   └── AI Voice Report
           │
           ▼
    OpenAI Whisper
    Speech → Text
           │
           ▼
       Gemini AI
    Information Extraction
           │
           ▼
      Admin Console
     Central Control
           │
     ┌─────┴─────┐
     │           │
 Verify       Prioritize
     │           │
     └─────┬─────┘
           ▼
 Appropriate Department
           │
           ▼
   Field Dispatch Team
           │
           ▼
   Inspection / Repair
           │
           ▼
      Status Update
           │
           ▼
      Admin Console
           │
           ▼
    Citizen Notification
