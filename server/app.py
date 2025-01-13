from flask import Flask, request, jsonify
from langdetect import detect
from flask_cors import CORS
import http.client
import pycountry
import json
import PyPDF2
import spacy
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)
CORS(app)

# Load API key securely
GOOGLE_TRANSLATOR_API_KEY = os.getenv("API_KEY")
GOOGLE_TRANSLATOR_API_HOST = os.getenv("API_HOST")

# Load spaCy NLP model
try:
    nlp = spacy.load("en_core_web_sm")
except Exception:
    from spacy.cli import download
    download("en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

# Piracy keywords
PIRACY_KEYWORDS = [
    "torrent", "illegal download", "piracy", "bootleg", "streaming",
    "free download", "warez", "camrip", "dvdrip", "hdtorrent",
    "crack", "cracked version", "serial key", "license key",
    "illegal streaming", "unauthorized", "leaked", "rip",
    "seed", "peer-to-peer", "P2P", "magnet link", "proxy",
    "pirate bay", "1337x", "yify", "RARBG", "katcr",
    "streaming site", "free movies", "APK download", "ISO file",
    "keygen", "fake license", "free software", "unlicensed",
    "bypass activation", "license bypass", "copyright violation", "pirated", "rarbg"
]

# Function to use Google Translator API for translation
def google_translate(text, source_language):
    conn = http.client.HTTPSConnection(GOOGLE_TRANSLATOR_API_HOST)
    payload = json.dumps({
        "q": text,
        "source": source_language,
        "target": "en",
        "format": "text"
    })
    headers = {
        'x-rapidapi-key': GOOGLE_TRANSLATOR_API_KEY,
        'x-rapidapi-host': GOOGLE_TRANSLATOR_API_HOST,
        'Content-Type': 'application/json'
    }
    conn.request("POST", "/v2", payload, headers)
    res = conn.getresponse()
    data = res.read()

    if res.status != 200:
        raise ValueError(f"Translation API failed with status code {res.status}: {data.decode('utf-8')}")

    response = json.loads(data.decode("utf-8"))
    return response['data']['translations'][0]['translatedText']

# Detect language and return code
def detect_language(text):
    language_code = detect(text)
    try:
        language_name = pycountry.languages.get(alpha_2=language_code).name
    except AttributeError:
        language_name = "Unknown"
    return language_code, language_name

# Enhanced function to detect piracy keywords using spaCy
def detect_piracy_keywords(text):
    doc = nlp(text.lower())
    tokens = [token.text for token in doc]
    return [kw for kw in PIRACY_KEYWORDS if kw in tokens]

@app.route('/process', methods=['POST'])
def process():
    try:
        text = None

        # Check if a PDF file was uploaded
        if 'file' in request.files:
            file = request.files['file']
            if file.filename.endswith('.pdf'):
                try:
                    pdf_reader = PyPDF2.PdfReader(file)
                    text = ''.join(page.extract_text() for page in pdf_reader.pages)
                except Exception as e:
                    return jsonify({'error': f'Failed to extract text from PDF: {str(e)}'}), 400
            else:
                return jsonify({'error': 'Unsupported file type. Please upload a PDF.'}), 400

        # Check if text is provided in the JSON body
        elif request.json:
            text = request.json.get('text', '').strip()

        # Validate input
        if not text or len(text) < 5:
            return jsonify({'error': 'Input text must be at least 5 characters long.'}), 400

        # Detect language
        language_code, language_name = detect_language(text)

        # If the language is not English, translate and detect piracy keywords
        if language_code != 'en':
            translated_text = google_translate(text, language_code)
            keywords = detect_piracy_keywords(translated_text)

            # Return success if no piracy keywords are found
            if not keywords:
                return jsonify({
                    'original_text': text,
                    'translated_text': translated_text,
                    'detected_language': language_name,
                    'success': 'Text is pirate-free.'
                }), 200

            # Return detected piracy keywords
            return jsonify({
                'original_text': text,
                'translated_text': translated_text,
                'detected_language': language_name,
                'keywords': keywords,
            }), 200

        else:
            # Detect piracy keywords in English text
            keywords = detect_piracy_keywords(text)
            if not keywords:
                return jsonify({
                    'original_text': text,
                    'success': 'Text is pirate-free.'
                }), 200

            return jsonify({
                'original_text': text,
                'keywords': keywords,
            }), 200

    except ValueError as ve:
        return jsonify({'error': str(ve)}), 500
    except Exception as e:
        return jsonify({'error': f'An error occurred: {str(e)}'}), 500


if __name__ == '__main__':
    app.run(debug=True)
