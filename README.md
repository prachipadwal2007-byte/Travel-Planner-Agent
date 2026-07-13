# ✈ WanderAI — AI-Powered Travel Planner Agent

> **AI-powered travel planning with IBM watsonx.ai Granite models + Flask**

WanderAI is a full-stack web application that uses **IBM Granite LLMs via watsonx.ai** to generate:
- 📅 Day-wise personalized travel itineraries
- 🌍 AI destination recommendations
- 💰 Detailed travel budget breakdowns
- 🎒 Packing checklists & safety tips
- 🏨 Hotel, food & transport recommendations
- 💬 Conversational travel chat assistant

---

## 🏗 Project Structure

```
Travel Planner Agent/
├── app.py                    # Flask backend + IBM watsonx.ai integration
├── requirements.txt          # Python dependencies
├── .env.example              # Environment variable template
├── .env                      # Your credentials (NOT committed to git)
├── templates/
│   ├── base.html             # Base layout (navbar, footer, dark mode)
│   ├── index.html            # Home / landing page
│   ├── dashboard.html        # Chat dashboard
│   ├── trip_planner.html     # Day-wise itinerary generator
│   ├── destinations.html     # Destination discovery
│   ├── budget.html           # Budget planner
│   └── profile.html          # Traveler profile
└── static/
    ├── css/
    │   └── style.css         # Full UI stylesheet (dark mode, animations)
    └── js/
        ├── theme.js          # Dark/light mode toggle
        ├── main.js           # Shared utilities (markdown, toasts)
        ├── chat.js           # Chat engine (shared + dashboard)
        ├── dashboard.js      # Dashboard extras
        ├── trip_planner.js   # Trip planner logic
        ├── destinations.js   # Destinations logic
        ├── budget.js         # Budget planner logic
        └── profile.js        # Profile management
```

---

## ⚡ Quick Start

### 1. Clone / Download the project

```bash
cd "Travel Planner Agent"
```

### 2. Create a Python virtual environment

```bash
# Windows (PowerShell)
python -m venv venv
.\venv\Scripts\Activate.ps1

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure credentials

```bash
# Copy the example file
cp .env.example .env      # macOS/Linux
copy .env.example .env    # Windows
```

Edit `.env` with your IBM credentials:

```env
IBM_API_KEY=your_ibm_cloud_api_key_here
WATSONX_PROJECT_ID=your_watsonx_project_id_here
WATSONX_URL=https://us-south.ml.cloud.ibm.com
FLASK_SECRET_KEY=change-me-to-a-long-random-secret
FLASK_ENV=development
PORT=5000
```

### 5. Run the application

```bash
python app.py
```

Open your browser: **http://localhost:5000**

---

## 🔑 Getting IBM Credentials

### IBM Cloud API Key
1. Log in to [IBM Cloud](https://cloud.ibm.com)
2. Go to **Manage → Access (IAM) → API Keys**
3. Click **Create an IBM Cloud API key**
4. Copy and save the key to your `.env`

### watsonx.ai Project ID
1. Go to [watsonx.ai](https://dataplatform.cloud.ibm.com)
2. Open or create a project
3. Go to **Manage → General → Project ID**
4. Copy the Project ID to your `.env`

---

## 🤖 Customizing the AI Agent

The entire agent behavior is controlled by the `AGENT_INSTRUCTIONS` block in [`app.py`](app.py) (lines ~30–100).

You can customize:

| Section | What to Edit |
|---|---|
| **Personality & Tone** | Change how WanderAI speaks — formal, casual, enthusiastic |
| **Travel Style** | Eco-friendly, luxury, backpacker, cultural immersion |
| **Safety Rules** | Mandatory advisories, insurance recommendations |
| **Budget Preferences** | Default tiers, currency format, cost-saving emphasis |
| **Itinerary Format** | Structure of day plans, time slots, categories |
| **Destination Recommendations** | Number of picks, criteria, hidden gem policy |
| **Food & Culture** | How many restaurants, dietary defaults |
| **Packing & Weather** | Checklist depth, seasonal defaults |

Example customization:
```python
AGENT_INSTRUCTIONS = """
You are WanderAI, a luxury travel specialist...
## PERSONALITY
- Sophisticated, refined, use elegant vocabulary
## BUDGET PREFERENCES
- Always default to luxury tier
- Recommend 5-star hotels only
...
"""
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Home page |
| `GET` | `/dashboard` | Chat dashboard |
| `GET` | `/trip-planner` | Trip planner |
| `GET` | `/destinations` | Destination discovery |
| `GET` | `/budget` | Budget planner |
| `GET` | `/profile` | Traveler profile |
| `POST` | `/api/chat` | Conversational AI chat |
| `POST` | `/api/generate-itinerary` | Day-wise itinerary |
| `POST` | `/api/recommend-destinations` | Destination recommendations |
| `POST` | `/api/budget-planner` | Budget breakdown |
| `POST` | `/api/save-profile` | Save traveler profile |
| `GET` | `/api/get-profile` | Load traveler profile |
| `GET` | `/api/health` | Health check |

### Example API call:
```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Plan a 5-day trip to Tokyo", "history": [], "profile": {}}'
```

---

## 🚀 Deployment

### Option A — Gunicorn (Linux/macOS)

```bash
gunicorn -w 2 -b 0.0.0.0:5000 app:app
```

### Option B — IBM Code Engine

1. Create an `app.yaml`:
```yaml
name: wanderai
runtime: python-3.11
build:
  strategy: dockerfile
env:
  IBM_API_KEY: <your-key>
  WATSONX_PROJECT_ID: <your-project-id>
```

2. Deploy:
```bash
ibmcloud ce application create --name wanderai --image us.icr.io/my-ns/wanderai
```

### Option C — Docker

Create a `Dockerfile`:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["gunicorn", "-w", "2", "-b", "0.0.0.0:5000", "app:app"]
```

Build and run:
```bash
docker build -t wanderai .
docker run -p 5000:5000 --env-file .env wanderai
```

### Option D — Heroku / Railway

Add a `Procfile`:
```
web: gunicorn app:app
```

Set environment variables in the platform dashboard and deploy.

---

## 🎨 Features Overview

| Feature | Description |
|---------|-------------|
| **🤖 AI Chat Concierge** | Conversational travel assistant powered by IBM Granite |
| **📅 Trip Planner** | Day-wise itineraries with timing, hotels, food, transport |
| **🌍 Destination Discovery** | AI-curated destination picks based on preferences |
| **💰 Budget Planner** | Detailed cost breakdowns with 3-tier (Budget/Mid/Luxury) |
| **👤 Traveler Profile** | Personalize AI responses to your style and preferences |
| **🌙 Dark Mode** | Full dark/light mode toggle, persists across sessions |
| **📱 Mobile Responsive** | Optimized for all screen sizes |
| **⌨ Keyboard Shortcuts** | Enter to send chat, suggestion chips for quick queries |

---

## 🔒 Security Notes

- **Never commit `.env`** to version control — add it to `.gitignore`
- Use a strong `FLASK_SECRET_KEY` in production (32+ random characters)
- Set `FLASK_ENV=production` in production deployments
- The IBM API Key is only used server-side — never exposed to the browser

---

## 📦 Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `flask` | 3.0.3 | Web framework |
| `flask-cors` | 4.0.1 | CORS headers |
| `python-dotenv` | 1.0.1 | `.env` file loading |
| `ibm-watsonx-ai` | 1.1.2 | IBM Granite AI client |
| `requests` | 2.32.3 | HTTP client |
| `gunicorn` | 22.0.0 | Production WSGI server |

---

## 🐛 Troubleshooting

**`ValueError: IBM_API_KEY and WATSONX_PROJECT_ID must be set`**
→ Ensure your `.env` file exists and has the correct values.

**`ibm_watsonx_ai` import error**
→ Run `pip install ibm-watsonx-ai==1.1.2` — do not use `ibm-watson` (deprecated).

**Slow responses**
→ IBM Granite inference takes 5–20 seconds. This is normal for LLM generation.

**`401 Unauthorized` from watsonx.ai**
→ Check your API key and project ID. Make sure the project is in the same IBM Cloud region as `WATSONX_URL`.

**Model not found**
→ Change `model_id` in `get_watsonx_model()` to an available Granite model in your region (e.g., `ibm/granite-13b-instruct-v2`).

---

*Built with ❤ using IBM watsonx.ai · Flask · Bootstrap 5*
