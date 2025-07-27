# EduPulse - Learning Analytics Dashboard

EduPulse is an AI-powered learning analytics platform that provides real-time insights into educational trends and community sentiment by analyzing Reddit data from educational subreddits.

## 🚀 Features

- **Real-time Reddit Data Analysis**: Fetches trending posts from educational subreddits
- **AI-Powered Sentiment Analysis**: Uses TextBlob and VADER for comprehensive sentiment analysis
- **Trending Topic Detection**: Identifies and visualizes popular learning topics
- **Interactive Visualizations**: Charts, word clouds, and sentiment graphs
- **Course Recommendations**: Curated course suggestions based on trending topics
- **Responsive Design**: Modern UI with TailwindCSS and mobile-friendly layout

## 🛠️ Tech Stack

### Backend
- **Flask**: Python web framework
- **PRAW**: Reddit API wrapper
- **TextBlob & VADER**: Natural Language Processing for sentiment analysis
- **BeautifulSoup**: Web scraping for course data
- **Pandas & NumPy**: Data manipulation and analysis

### Frontend
- **HTML5/CSS3**: Modern web standards
- **TailwindCSS**: Utility-first CSS framework
- **JavaScript (ES6+)**: Interactive functionality
- **Chart.js**: Data visualization library
- **WordCloud**: Keyword visualization

## 📋 Prerequisites

- Python 3.8+
- Reddit API credentials
- Modern web browser

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd EduPulse
```

### 2. Set Up Reddit API Credentials

1. Go to [Reddit App Preferences](https://www.reddit.com/prefs/apps)
2. Click "Create App" or "Create Another App"
3. Fill in the details:
   - **Name**: EduPulse
   - **Type**: Script
   - **Description**: Learning analytics dashboard
   - **About URL**: (optional)
   - **Redirect URI**: http://localhost:8080
4. Note down your `client_id` and `client_secret`

### 3. Configure Environment Variables

Create a `.env` file in the root directory:
```bash
cp env_example.txt .env
```

Edit `.env` with your Reddit credentials:
```env
REDDIT_CLIENT_ID=your_client_id_here
REDDIT_CLIENT_SECRET=your_client_secret_here
REDDIT_USER_AGENT=EduPulse/1.0
FLASK_ENV=development
FLASK_DEBUG=True
```

### 4. Install Dependencies
```bash
pip install -r requirements.txt
```

### 5. Run the Application
```bash
python app.py
```

The application will be available at:
- **Backend API**: http://localhost:8000
- **Frontend**: http://localhost:8000/app

## 📊 API Endpoints

### Core Endpoints
- `GET /` - API information and available endpoints
- `GET /trending` - Trending topics and posts from Reddit
- `GET /sentiment` - Sentiment analysis data and statistics
- `GET /keywords` - Trending keywords and their frequencies
- `GET /courses` - Recommended online courses

### Utility Endpoints
- `GET /health` - Health check endpoint
- `GET /refresh` - Manually refresh cached data

### Example API Response
```json
{
  "posts": [
    {
      "id": "abc123",
      "title": "Best Python courses for beginners",
      "content": "I'm looking for recommendations...",
      "subreddit": "learnprogramming",
      "score": 150,
      "sentiment": {
        "combined": 0.75,
        "textblob": 0.8,
        "vader": 0.7
      }
    }
  ],
  "keywords": {
    "python": 45,
    "javascript": 32,
    "machine": 28
  },
  "total_posts": 50
}
```

## 🎨 Frontend Pages

### 1. Home Page
- Welcome message and project overview
- Call-to-action buttons for dashboard and courses
- Gradient background with modern design

### 2. Dashboard
- Real-time statistics cards
- Trending posts with sentiment indicators
- Interactive word cloud of keywords
- Auto-refresh every 5 minutes

### 3. Insights
- Sentiment distribution pie chart
- Sentiment timeline line chart
- Detailed sentiment statistics
- Visual sentiment analysis breakdown

### 4. Courses
- Grid layout of recommended courses
- Course ratings, student counts, and pricing
- Direct links to course platforms
- Category-based filtering

### 5. About
- Project features and tech stack
- API endpoint documentation
- Development information

## 🔧 Configuration

### Monitored Subreddits
Edit the `SUBREDDITS` list in `app.py` to customize which subreddits to monitor:
```python
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
```

### Cache Settings
The application caches data for 10 minutes by default. Modify the cache duration in the route handlers:
```python
# In route handlers, change the timedelta(minutes=10) value
```

## 🚀 Deployment

### Deploy to Render

1. **Create a Render Account**
   - Sign up at [render.com](https://render.com)

2. **Connect Your Repository**
   - Connect your GitHub repository to Render

3. **Create a Web Service**
   - **Name**: EduPulse
   - **Environment**: Python
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`

4. **Set Environment Variables**
   - Add your Reddit API credentials in Render dashboard
   - Set `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_USER_AGENT`

5. **Deploy**
   - Click "Create Web Service"
   - Render will automatically deploy your application

### Deploy to Replit

1. **Create a Replit Account**
   - Sign up at [replit.com](https://replit.com)

2. **Import Repository**
   - Create a new Python repl
   - Import your GitHub repository

3. **Configure Environment**
   - Add environment variables in the Secrets tab
   - Set your Reddit API credentials

4. **Run the Application**
   - Replit will automatically run `python app.py`

## 🔍 Troubleshooting

### Common Issues

1. **Reddit API Rate Limits**
   - The app respects Reddit's rate limits
   - If you hit limits, wait 15 minutes before retrying

2. **CORS Errors**
   - Ensure Flask-CORS is properly configured
   - Check that the frontend is accessing the correct API URL

3. **Missing Dependencies**
   - Run `pip install -r requirements.txt`
   - Check Python version compatibility

4. **Environment Variables**
   - Ensure `.env` file exists and contains correct credentials
   - Verify variable names match those in `app.py`

### Debug Mode
Enable debug mode for detailed error messages:
```python
app.run(debug=True, host='0.0.0.0', port=8000)
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Reddit API for providing educational community data
- TextBlob and VADER for sentiment analysis capabilities
- TailwindCSS for the beautiful UI framework
- Chart.js for interactive data visualizations

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the troubleshooting section above
- Review the API documentation

---

**EduPulse** - Empowering learning through data-driven insights 🚀 