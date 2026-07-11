"""
╔══════════════════════════════════════════════════════════════════════════════╗
║           AI TRAVEL PLANNER AGENT — IBM watsonx.ai + Flask                 ║
║           Backend: Flask | AI: IBM Granite via watsonx.ai                   ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

import os
import warnings
import traceback
from datetime import datetime
from flask import Flask, render_template, request, jsonify, session
from flask_cors import CORS
from dotenv import load_dotenv
from ibm_watsonx_ai import APIClient, Credentials
from ibm_watsonx_ai.foundation_models import ModelInference
from ibm_watsonx_ai.metanames import GenTextParamsMetaNames as GenParams

# Suppress deprecation/disclaimer warnings from the IBM SDK
warnings.filterwarnings("ignore", category=Warning, module="ibm_watsonx_ai")

# ─────────────────────────────────────────────────────────────────────────────
#  AGENT INSTRUCTIONS  ← Customize agent behavior here
# ─────────────────────────────────────────────────────────────────────────────
AGENT_INSTRUCTIONS = """
You are **WanderAI**, an expert AI-powered Travel Planner Agent built on IBM Granite.

## PERSONALITY & TONE
- Friendly, enthusiastic, and knowledgeable about global travel
- Conversational yet professional — like a seasoned personal travel concierge
- Use warm, encouraging language to inspire travel excitement
- Be concise but thorough; use bullet points and structured sections

## TRAVEL STYLE PHILOSOPHY
- Recommend a balance of popular landmarks AND hidden local gems
- Suggest eco-friendly and sustainable travel options when possible
- Respect local cultures, customs, and responsible tourism practices
- Tailor recommendations to traveler experience level (solo, couple, family, group)

## SAFETY RULES
- Always include safety tips for the destination
- Mention any travel advisories or health requirements (vaccinations, visas)
- Recommend travel insurance for all international trips
- Provide emergency contact numbers where relevant (local police, embassy)

## BUDGET PREFERENCES
- Always provide a budget breakdown (budget / mid-range / luxury tiers)
- Include cost-saving tips (off-season travel, local transport, street food)
- Estimate costs in USD with local currency equivalents
- Flag hidden costs (tourist taxes, tipping culture, entry fees)

## ITINERARY FORMAT
When generating a day-wise itinerary, always use this structured format:

### Day X: [Theme/Title]
**Morning (9:00 AM – 12:00 PM)**
- Activity 1 — brief description, estimated cost
- Activity 2 — brief description, estimated cost

**Afternoon (12:00 PM – 5:00 PM)**
- Activity 3 — brief description, estimated cost
- Lunch recommendation — restaurant name, cuisine, avg cost

**Evening (5:00 PM – 10:00 PM)**
- Activity 4 — brief description, estimated cost
- Dinner recommendation — restaurant name, cuisine, avg cost

**Accommodation:** Hotel/hostel name, category, price range
**Daily Budget Estimate:** $XX–$XX (budget) | $XX–$XX (mid) | $XX–$XX (luxury)

## DESTINATION RECOMMENDATIONS
- Recommend 5 destinations per query with pros/cons and best-visit season
- Include off-the-beaten-path alternatives to popular spots
- Mention UNESCO World Heritage Sites and national parks
- Always highlight local festivals and events during travel dates

## FOOD & CULTURE
- Recommend 3–5 must-try local dishes per destination
- Suggest popular local restaurants AND street food spots
- Note dietary restriction alternatives (vegetarian, vegan, halal, kosher)
- Include dining etiquette tips for the destination

## PACKING & WEATHER
- Generate climate-appropriate packing checklists
- Include tech essentials (adapters, portable charger, SIM card tips)
- Mention seasonal weather patterns and best packing strategies

## RESPONSE CAPABILITIES
You can help with:
1. Complete day-wise travel itineraries
2. Hotel and accommodation recommendations
3. Transportation planning (flights, trains, buses, car rental)
4. Tourist attractions and sightseeing tours
5. Local food and restaurant recommendations
6. Budget planning and cost breakdowns
7. Packing checklists tailored to destination and season
8. Travel safety tips and emergency information
9. Visa and entry requirements overview
10. Travel insurance recommendations
"""

# ─────────────────────────────────────────────────────────────────────────────
#  App Initialization
# ─────────────────────────────────────────────────────────────────────────────
load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "dev-secret-key-change-in-prod")
CORS(app)

# ─────────────────────────────────────────────────────────────────────────────
#  IBM watsonx.ai Client Setup
# ─────────────────────────────────────────────────────────────────────────────
def get_watsonx_model():
    """Initialize and return the IBM watsonx.ai Granite model."""
    api_key = os.getenv("IBM_API_KEY", "").strip()
    project_id = os.getenv("WATSONX_PROJECT_ID", "").strip()
    url = os.getenv("WATSONX_URL", "https://us-south.ml.cloud.ibm.com").strip().rstrip("/")

    if not api_key:
        raise ValueError(
            "IBM_API_KEY is missing. Make sure your .env file exists and contains IBM_API_KEY=<your-key>."
        )
    if not project_id:
        raise ValueError(
            "WATSONX_PROJECT_ID is missing. Make sure your .env file contains WATSONX_PROJECT_ID=<your-project-id>."
        )

    # Validate URL — must be an IBM Cloud SaaS watsonx.ai endpoint
    valid_prefixes = (
        "https://us-south.ml.cloud.ibm.com",
        "https://eu-de.ml.cloud.ibm.com",
        "https://eu-gb.ml.cloud.ibm.com",
        "https://jp-tok.ml.cloud.ibm.com",
        "https://au-syd.ml.cloud.ibm.com",
        "https://ca-tor.ml.cloud.ibm.com",
        "https://br-sao.ml.cloud.ibm.com",
    )
    if not any(url.startswith(p) for p in valid_prefixes):
        raise ValueError(
            f"WATSONX_URL '{url}' is not a valid IBM watsonx.ai SaaS endpoint.\n"
            "Supported regions: us-south, eu-de, eu-gb, jp-tok, au-syd, ca-tor, br-sao\n"
            "Example: https://au-syd.ml.cloud.ibm.com\n"
            "Tip: Check your IBM Cloud account region at cloud.ibm.com/resources"
        )

    credentials = Credentials(url=url, api_key=api_key)
    client = APIClient(credentials=credentials, project_id=project_id)

    model = ModelInference(
        model_id="meta-llama/llama-3-3-70b-instruct",
        api_client=client,
        project_id=project_id,
        params={
            GenParams.MAX_NEW_TOKENS: 2048,
            GenParams.MIN_NEW_TOKENS: 50,
            GenParams.TEMPERATURE: 0.7,
            GenParams.TOP_P: 0.9,
            GenParams.TOP_K: 50,
            GenParams.REPETITION_PENALTY: 1.1,
        },
    )
    return model


# ─────────────────────────────────────────────────────────────────────────────
#  Chat Message Builders  (modern chat API — list of role/content dicts)
# ─────────────────────────────────────────────────────────────────────────────
def build_travel_messages(user_message: str, chat_history: list, traveler_profile: dict) -> list:
    """Build chat messages list for the travel agent."""
    profile_context = ""
    if traveler_profile:
        profile_context = (
            "\n\n## TRAVELER PROFILE\n"
            f"- Name: {traveler_profile.get('name', 'Traveler')}\n"
            f"- Travel Style: {traveler_profile.get('travel_style', 'Mixed')}\n"
            f"- Budget Tier: {traveler_profile.get('budget_tier', 'Mid-range')}\n"
            f"- Group Type: {traveler_profile.get('group_type', 'Solo')}\n"
            f"- Interests: {traveler_profile.get('interests', 'Culture, Food, Adventure')}\n"
            f"- Dietary Restrictions: {traveler_profile.get('dietary', 'None')}\n"
            f"- Home Country: {traveler_profile.get('home_country', 'USA')}\n"
        )

    messages = [{"role": "system", "content": AGENT_INSTRUCTIONS + profile_context}]

    # Inject last 3 exchanges from history
    for msg in chat_history[-6:]:
        messages.append({"role": msg["role"], "content": msg["content"]})

    messages.append({"role": "user", "content": user_message})
    return messages


def build_itinerary_messages(destination: str, days: int, budget: str,
                              group_type: str, interests: str) -> list:
    return [
        {"role": "system", "content": AGENT_INSTRUCTIONS},
        {"role": "user", "content": (
            f"Create a detailed {days}-day travel itinerary for {destination}.\n"
            f"- Budget tier: {budget}\n"
            f"- Group type: {group_type}\n"
            f"- Interests: {interests}\n"
            "- Include: day-wise plan, hotel recommendations, local food, "
            "transport tips, packing checklist, estimated total budget."
        )},
    ]


def build_destinations_messages(preferences: str, budget: str, season: str) -> list:
    return [
        {"role": "system", "content": AGENT_INSTRUCTIONS},
        {"role": "user", "content": (
            f"Recommend 5 travel destinations based on:\n"
            f"- Traveler preferences: {preferences}\n"
            f"- Budget tier: {budget}\n"
            f"- Travel season: {season}\n"
            "For each destination provide: overview, highlights, best time to visit, "
            "estimated cost, and a hidden gem nearby."
        )},
    ]


def build_budget_messages(destination: str, days: int, travelers: int,
                           budget_tier: str) -> list:
    return [
        {"role": "system", "content": AGENT_INSTRUCTIONS},
        {"role": "user", "content": (
            f"Create a detailed budget breakdown for a {days}-day trip to {destination} "
            f"for {travelers} traveler(s) with a {budget_tier} budget.\n"
            "Include: flights, accommodation, food, local transport, activities/attractions, "
            "shopping, miscellaneous, and travel insurance.\n"
            "Provide totals per person and for the group. Add 3 cost-saving tips."
        )},
    ]


def chat_generate(messages: list) -> str:
    """Call the modern chat completions API and return the assistant reply."""
    model = get_watsonx_model()
    response = model.chat(messages=messages)
    # Extract text from response
    choices = response.get("choices", [])
    if choices:
        return choices[0].get("message", {}).get("content", "").strip()
    return ""


# ─────────────────────────────────────────────────────────────────────────────
#  Flask Routes — Pages
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")


@app.route("/trip-planner")
def trip_planner():
    return render_template("trip_planner.html")


@app.route("/destinations")
def destinations():
    return render_template("destinations.html")


@app.route("/budget")
def budget():
    return render_template("budget.html")


@app.route("/profile")
def profile():
    return render_template("profile.html")


# ─────────────────────────────────────────────────────────────────────────────
#  Flask Routes — API
# ─────────────────────────────────────────────────────────────────────────────
@app.route("/api/chat", methods=["POST"])
def chat():
    """Main chat endpoint — conversational travel assistant."""
    try:
        data = request.get_json()
        user_message = data.get("message", "").strip()
        chat_history = data.get("history", [])
        traveler_profile = data.get("profile", {})

        if not user_message:
            return jsonify({"error": "Message cannot be empty"}), 400

        messages = build_travel_messages(user_message, chat_history, traveler_profile)
        reply = chat_generate(messages)
        if not reply:
            reply = "I'm sorry, I couldn't generate a response. Please try again."

        return jsonify({
            "reply": reply,
            "timestamp": datetime.now().isoformat(),
            "status": "success"
        })

    except ValueError as e:
        return jsonify({"error": str(e), "status": "config_error"}), 500
    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "error": "An error occurred while processing your request.",
            "details": str(e),
            "status": "error"
        }), 500


@app.route("/api/generate-itinerary", methods=["POST"])
def generate_itinerary():
    """Generate a structured day-wise travel itinerary."""
    try:
        data = request.get_json()
        destination = data.get("destination", "").strip()
        days = int(data.get("days", 5))
        budget = data.get("budget", "Mid-range")
        group_type = data.get("group_type", "Solo")
        interests = data.get("interests", "Culture, Food, Sightseeing")

        if not destination:
            return jsonify({"error": "Destination is required"}), 400

        days = max(1, min(days, 21))
        messages = build_itinerary_messages(destination, days, budget, group_type, interests)
        itinerary = chat_generate(messages)

        return jsonify({
            "itinerary": itinerary,
            "destination": destination,
            "days": days,
            "timestamp": datetime.now().isoformat(),
            "status": "success"
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e), "status": "error"}), 500


@app.route("/api/recommend-destinations", methods=["POST"])
def recommend_destinations():
    """Get AI-powered destination recommendations."""
    try:
        data = request.get_json()
        preferences = data.get("preferences", "beaches, history, food")
        budget = data.get("budget", "Mid-range")
        season = data.get("season", "any season")

        messages = build_destinations_messages(preferences, budget, season)
        recommendations = chat_generate(messages)

        return jsonify({
            "recommendations": recommendations,
            "status": "success",
            "timestamp": datetime.now().isoformat()
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e), "status": "error"}), 500


@app.route("/api/budget-planner", methods=["POST"])
def budget_planner():
    """Generate a detailed travel budget breakdown."""
    try:
        data = request.get_json()
        destination = data.get("destination", "").strip()
        days = int(data.get("days", 7))
        travelers = int(data.get("travelers", 1))
        budget_tier = data.get("budget_tier", "Mid-range")

        if not destination:
            return jsonify({"error": "Destination is required"}), 400

        messages = build_budget_messages(destination, days, travelers, budget_tier)
        budget_plan = chat_generate(messages)

        return jsonify({
            "budget_plan": budget_plan,
            "destination": destination,
            "days": days,
            "travelers": travelers,
            "status": "success",
            "timestamp": datetime.now().isoformat()
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e), "status": "error"}), 500


@app.route("/api/save-profile", methods=["POST"])
def save_profile():
    """Save traveler profile to session."""
    try:
        data = request.get_json()
        session["traveler_profile"] = {
            "name": data.get("name", "Traveler"),
            "travel_style": data.get("travel_style", "Mixed"),
            "budget_tier": data.get("budget_tier", "Mid-range"),
            "group_type": data.get("group_type", "Solo"),
            "interests": data.get("interests", "Culture, Food, Adventure"),
            "dietary": data.get("dietary", "None"),
            "home_country": data.get("home_country", "USA"),
            "passport": data.get("passport", ""),
        }
        return jsonify({"message": "Profile saved successfully!", "status": "success"})
    except Exception as e:
        return jsonify({"error": str(e), "status": "error"}), 500


@app.route("/api/get-profile", methods=["GET"])
def get_profile():
    """Retrieve saved traveler profile from session."""
    profile = session.get("traveler_profile", {})
    return jsonify({"profile": profile, "status": "success"})


@app.route("/api/health", methods=["GET"])
def health():
    """Health check endpoint."""
    api_key = os.getenv("IBM_API_KEY", "")
    project_id = os.getenv("WATSONX_PROJECT_ID", "")
    return jsonify({
        "status": "healthy",
        "service": "WanderAI Travel Planner",
        "watsonx_configured": bool(api_key and project_id),
        "timestamp": datetime.now().isoformat()
    })


# ─────────────────────────────────────────────────────────────────────────────
#  Run
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_ENV", "development") == "development"
    print(f"\n🌍 WanderAI Travel Planner starting on http://localhost:{port}")
    print(f"   Environment : {os.getenv('FLASK_ENV', 'development')}")
    print(f"   watsonx.ai  : {'✅ Configured' if os.getenv('IBM_API_KEY') else '❌ Missing API Key'}\n")
    app.run(host="0.0.0.0", port=port, debug=debug)
