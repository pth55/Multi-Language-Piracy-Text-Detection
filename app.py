from flask import Flask, render_template, request
from text_process import translate_text_hf, detect_piracy_keywords, detect_language

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/process', methods=['POST'])
def process_text():
    non_english_text = request.form['text']
    
    detected_language = detect_language(non_english_text)
    
    if detected_language == 'en':
       
        result = {
            'error': "Please enter text in a non-English language."
        }
        return render_template('index.html', result=result)
    
   
    translated_text = translate_text_hf(non_english_text)
 
    keywords = detect_piracy_keywords(translated_text)
    
    
    result = {
        'original_text': non_english_text,
        'translated_text': translated_text,
        'keywords': keywords
    }
    return render_template('index.html', result=result)

if __name__ == '__main__':
    app.run(debug=True)
