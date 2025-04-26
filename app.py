from flask import Flask, render_template, request, jsonify
import os
import sys

# Import the FakeNewsDetectorInterface class
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from models.detector import FakeNewsDetectorInterface

app = Flask(__name__)

# Initialize the detector
detector = FakeNewsDetectorInterface(model_path='models/best_fake_news_model.pt')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    title = data.get('title', '')
    text = data.get('text', '')
    
    # Validate input
    if not title or not text:
        return jsonify({
            'error': 'Both title and text are required',
            'status': 'error'
        }), 400
    
    try:
        # Get prediction
        result = detector.predict(title, text)
        
        # Prepare response
        response = {
            'prediction': result['prediction'],
            'confidence': round(result['confidence'] * 100, 2),
            'fake_probability': round(result['probabilities']['fake'] * 100, 2),
            'real_probability': round(result['probabilities']['real'] * 100, 2),
            'status': 'success'
        }
        
        return jsonify(response)
    
    except Exception as e:
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 500

if __name__ == '__main__':
    app.run(host="0.0.0.0", debug=True)