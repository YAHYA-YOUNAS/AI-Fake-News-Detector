import torch
from torch import nn
from transformers import BertTokenizer, BertModel

class FakeNewsClassifier(nn.Module):
    """BERT-based model for fake news classification"""
    
    def __init__(self, dropout_rate=0.3):
        super(FakeNewsClassifier, self).__init__()
        self.bert = BertModel.from_pretrained('bert-base-uncased')
        self.dropout = nn.Dropout(dropout_rate)
        self.linear = nn.Linear(768, 2)  # 768 is BERT's hidden size, 2 classes (real/fake)
        
    def forward(self, input_ids, attention_mask):
        # Get BERT outputs
        outputs = self.bert(input_ids=input_ids, attention_mask=attention_mask)
        
        # Use the [CLS] token representation for classification
        pooled_output = outputs.pooler_output
        
        # Apply dropout and get logits
        x = self.dropout(pooled_output)
        logits = self.linear(x)
        
        return logits

class FakeNewsDetectorInterface:
    """Interface for making predictions with the fake news detector model"""
    
    def __init__(self, model_path='best_fake_news_model.pt'):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model_path = model_path
        self.max_length = 256
        
        # Initialize tokenizer
        print("Loading BERT tokenizer...")
        self.tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')
        
        # Initialize and load model
        print(f"Loading model from {model_path}...")
        self.model = FakeNewsClassifier()
        
        try:
            self.model.load_state_dict(torch.load(self.model_path, map_location=self.device))
            self.model.to(self.device)
            self.model.eval()
            print("Model loaded successfully!")
        except Exception as e:
            print(f"Error loading model: {e}")
            print("Using untrained model. Please train the model or provide a valid model path.")
    
    def predict(self, title, text):
        """Make a prediction on a news article"""
        # Prepare the input
        combined_text = title + " [SEP] " + text
        
        encoding = self.tokenizer.encode_plus(
            combined_text,
            add_special_tokens=True,
            max_length=self.max_length,
            padding='max_length',
            truncation=True,
            return_tensors='pt'
        )
        
        input_ids = encoding['input_ids'].to(self.device)
        attention_mask = encoding['attention_mask'].to(self.device)
        
        # Make prediction
        with torch.no_grad():
            outputs = self.model(input_ids, attention_mask)
            _, prediction = torch.max(outputs, 1)
        
        # Convert prediction to label
        predicted_label = "Real" if prediction.item() == 1 else "Fake"
        
        # Calculate confidence
        probabilities = torch.nn.functional.softmax(outputs, dim=1)
        confidence = probabilities[0][prediction.item()].item()
        
        return {
            'prediction': predicted_label,
            'confidence': confidence,
            'probabilities': {
                'fake': probabilities[0][0].item(),
                'real': probabilities[0][1].item()
            }
        }