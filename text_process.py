from transformers import pipeline
import spacy
from langdetect import detect


nlp = spacy.blank("en")  

PIRACY_KEYWORDS = [
    "torrent", "illegal download", "piracy", "bootleg", "streaming", 
    "free download", "warez", "camrip", "dvdrip", "hdtorrent", 
    "crack", "cracked version", "serial key", "license key", 
    "illegal streaming", "unauthorized", "leaked", "rip", 
    "seed", "peer-to-peer", "P2P", "magnet link", "proxy", 
    "pirate bay", "1337x", "yify", "RARBG", "katcr", 
    "streaming site", "free movies", "APK download", "ISO file", 
    "keygen", "fake license", "free software", "unlicensed", 
    "bypass activation", "license bypass", "copyright violation"
]

def translate_text_hf(text):
   
    translator = pipeline("translation", model="Helsinki-NLP/opus-mt-mul-en")
    translation = translator(text)[0]['translation_text']
    return translation

def detect_language(text):
    
    return detect(text)

def detect_piracy_keywords(text):
   
    detected_keywords = []
    for keyword in PIRACY_KEYWORDS:
        if keyword in text.lower():  
            detected_keywords.append(keyword)
    return detected_keywords
