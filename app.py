from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import praw
import requests
from bs4 import BeautifulSoup
from textblob import TextBlob
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import pandas as pd
import numpy as np
from collections import Counter
import re
import os
from dotenv import load_dotenv
import json
from datetime import datetime, timedelta
import time

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize Reddit client
reddit = praw.Reddit(
    client_id=os.getenv('REDDIT_CLIENT_ID', 'your_client_id'),
    client_secret=os.getenv('REDDIT_CLIENT_SECRET', 'your_client_secret'),
    user_agent=os.getenv('REDDIT_USER_AGENT', 'EduPulse/1.0')
)

# Initialize sentiment analyzers
vader_analyzer = SentimentIntensityAnalyzer()

# In-memory storage for caching
cache = {
    'trending_data': None,
    'sentiment_data': None,
    'keywords_data': None,
    'courses_data': None,
    'last_updated': None
}

# Subreddits to monitor
SUBREDDITS = [
    'learnprogramming',
    'edtech',
    'OnlineCourses',
    'MachineLearning',
    'datascience',
    'webdev',
    'python',
    'javascript'
]

def analyze_sentiment(text):
    """Analyze sentiment using both TextBlob and VADER"""
    # TextBlob sentiment
    blob = TextBlob(text)
    textblob_sentiment = blob.sentiment.polarity
    
    # VADER sentiment
    vader_scores = vader_analyzer.polarity_scores(text)
    vader_sentiment = vader_scores['compound']
    
    # Combined sentiment score
    combined_sentiment = (textblob_sentiment + vader_sentiment) / 2
    
    return {
        'textblob': textblob_sentiment,
        'vader': vader_sentiment,
        'combined': combined_sentiment,
        'vader_scores': vader_scores
    }

def extract_keywords(text, top_n=20):
    """Extract keywords from text"""
    # Remove special characters and convert to lowercase
    text = re.sub(r'[^\w\s]', '', text.lower())
    words = text.split()
    
    # Remove common stop words
    stop_words = {
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
        'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those',
        'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her',
        'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their'
    }
    
    # Filter out stop words and short words
    keywords = [word for word in words if word not in stop_words and len(word) > 2]
    
    # Count frequency
    keyword_counts = Counter(keywords)
    
    return dict(keyword_counts.most_common(top_n))

def fetch_reddit_posts(limit=50):
    """Fetch posts from monitored subreddits"""
    posts = []
    
    for subreddit_name in SUBREDDITS:
        try:
            subreddit = reddit.subreddit(subreddit_name)
            
            # Fetch hot posts
            for post in subreddit.hot(limit=limit//len(SUBREDDITS)):
                sentiment = analyze_sentiment(post.title + ' ' + (post.selftext or ''))
                
                post_data = {
                    'id': post.id,
                    'title': post.title,
                    'content': post.selftext[:500] if post.selftext else '',
                    'subreddit': subreddit_name,
                    'score': post.score,
                    'upvote_ratio': post.upvote_ratio,
                    'num_comments': post.num_comments,
                    'created_utc': post.created_utc,
                    'url': post.url,
                    'sentiment': sentiment,
                    'keywords': extract_keywords(post.title + ' ' + (post.selftext or ''))
                }
                posts.append(post_data)
                
        except Exception as e:
            print(f"Error fetching from r/{subreddit_name}: {e}")
            continue
    
    return posts

def scrape_course_suggestions():
    """Scrape course suggestions from educational platforms"""
    courses = []
    
    # Mock course data (in production, you'd scrape from Coursera, Udemy, etc.)
    mock_courses = [
        {
            'title': 'Python for Data Science',
            'platform': 'Coursera',
            'rating': 4.7,
            'students': 150000,
            'price': '$49',
            'url': 'https://coursera.org/python-data-science',
            'category': 'Programming'
        },
        {
            'title': 'Machine Learning Fundamentals',
            'platform': 'Udemy',
            'rating': 4.6,
            'students': 89000,
            'price': '$29.99',
            'url': 'https://udemy.com/ml-fundamentals',
            'category': 'Machine Learning'
        },
        {
            'title': 'Web Development Bootcamp',
            'platform': 'Coursera',
            'rating': 4.8,
            'students': 220000,
            'price': '$79',
            'url': 'https://coursera.org/web-dev-bootcamp',
            'category': 'Web Development'
        },
        {
            'title': 'JavaScript ES6+ Complete Guide',
            'platform': 'Udemy',
            'rating': 4.5,
            'students': 67000,
            'price': '$19.99',
            'url': 'https://udemy.com/javascript-es6',
            'category': 'Programming'
        },
        {
            'title': 'Data Science with Python',
            'platform': 'edX',
            'rating': 4.4,
            'students': 45000,
            'price': '$99',
            'url': 'https://edx.org/data-science-python',
            'category': 'Data Science'
        }
    ]
    
    return mock_courses

def update_cache():
    """Update cached data"""
    print("Updating cache...")
    
    # Fetch Reddit posts
    posts = fetch_reddit_posts()
    
    # Extract trending topics
    all_keywords = {}
    for post in posts:
        for keyword, count in post['keywords'].items():
            all_keywords[keyword] = all_keywords.get(keyword, 0) + count
    
    trending_keywords = dict(sorted(all_keywords.items(), key=lambda x: x[1], reverse=True)[:20])
    
    # Analyze sentiment trends
    sentiment_scores = [post['sentiment']['combined'] for post in posts]
    avg_sentiment = np.mean(sentiment_scores)
    
    # Get top posts by score
    top_posts = sorted(posts, key=lambda x: x['score'], reverse=True)[:10]
    
    # Update cache
    cache['trending_data'] = {
        'posts': top_posts,
        'keywords': trending_keywords,
        'total_posts': len(posts),
        'subreddits': SUBREDDITS
    }
    
    cache['sentiment_data'] = {
        'average_sentiment': avg_sentiment,
        'sentiment_distribution': {
            'positive': len([s for s in sentiment_scores if s > 0.1]),
            'neutral': len([s for s in sentiment_scores if -0.1 <= s <= 0.1]),
            'negative': len([s for s in sentiment_scores if s < -0.1])
        },
        'sentiment_scores': sentiment_scores
    }
    
    cache['keywords_data'] = trending_keywords
    cache['courses_data'] = scrape_course_suggestions()
    cache['last_updated'] = datetime.now().isoformat()

@app.route('/')
def home():
    """Home endpoint"""
    return jsonify({
        'message': 'Welcome to EduPulse API',
        'version': '1.0.0',
        'endpoints': {
            '/trending': 'Get trending learning topics',
            '/sentiment': 'Get sentiment analysis data',
            '/keywords': 'Get trending keywords',
            '/courses': 'Get course suggestions',
            '/health': 'Health check'
        }
    })

@app.route('/trending')
def get_trending():
    """Get trending topics and posts"""
    # Update cache if it's older than 10 minutes
    if (cache['last_updated'] is None or 
        datetime.now() - datetime.fromisoformat(cache['last_updated']) > timedelta(minutes=10)):
        update_cache()
    
    return jsonify(cache['trending_data'])

@app.route('/sentiment')
def get_sentiment():
    """Get sentiment analysis data"""
    if (cache['last_updated'] is None or 
        datetime.now() - datetime.fromisoformat(cache['last_updated']) > timedelta(minutes=10)):
        update_cache()
    
    return jsonify(cache['sentiment_data'])

@app.route('/keywords')
def get_keywords():
    """Get trending keywords"""
    if (cache['last_updated'] is None or 
        datetime.now() - datetime.fromisoformat(cache['last_updated']) > timedelta(minutes=10)):
        update_cache()
    
    return jsonify(cache['keywords_data'])

@app.route('/courses')
def get_courses():
    """Get course suggestions"""
    if (cache['last_updated'] is None or 
        datetime.now() - datetime.fromisoformat(cache['last_updated']) > timedelta(minutes=10)):
        update_cache()
    
    return jsonify(cache['courses_data'])

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'cache_updated': cache['last_updated']
    })

@app.route('/refresh')
def refresh_cache():
    """Manually refresh cache"""
    update_cache()
    return jsonify({
        'message': 'Cache refreshed successfully',
        'timestamp': cache['last_updated']
    })

# Serve static files
@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory('static', filename)

# Add a direct route to serve the main HTML file
@app.route('/app')
def serve_app():
    return send_from_directory('static', 'index.html')

if __name__ == '__main__':
    # Initialize cache on startup
    update_cache()
    print("🚀 EduPulse Real Server Starting...")
    print("📊 Using real Reddit data")
    print("🌐 Frontend will be available at: http://localhost:8000/static/index.html")
    print("🔗 API endpoints available at: http://localhost:8000/")
    app.run(debug=True, host='0.0.0.0', port=8000) 