// API Base URL
const API_BASE_URL = 'http://localhost:8000';

// Global variables
let charts = {};
let wordCloud = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    loadDashboardData();
    loadInsightsData();
    loadCoursesData();
});

// Navigation functionality
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetPage = this.getAttribute('href').substring(1);
            showPage(targetPage);
        });
    });

    // Show home page by default
    showPage('home');
}

function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.add('hidden');
    });

    // Show target page
    const targetSection = document.getElementById(pageId);
    if (targetSection) {
        targetSection.classList.remove('hidden');
    }

    // Update active navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('text-purple-600');
        link.classList.add('text-gray-700');
    });

    const activeLink = document.querySelector(`[href="#${pageId}"]`);
    if (activeLink) {
        activeLink.classList.remove('text-gray-700');
        activeLink.classList.add('text-purple-600');
    }

    // Load page-specific data
    switch(pageId) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'insights':
            loadInsightsData();
            break;
        case 'courses':
            loadCoursesData();
            break;
    }
}

// API Functions
async function fetchAPI(endpoint) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Dashboard Functions
async function loadDashboardData() {
    try {
        const [trendingData, sentimentData, coursesData] = await Promise.all([
            fetchAPI('/trending'),
            fetchAPI('/sentiment'),
            fetchAPI('/courses')
        ]);

        updateDashboardStats(trendingData, sentimentData, coursesData);
        displayTrendingPosts(trendingData.posts);
        createWordCloud(trendingData.keywords);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showError('Failed to load dashboard data');
    }
}

function updateDashboardStats(trendingData, sentimentData, coursesData) {
    // Update stats cards
    document.getElementById('trending-count').textContent = Object.keys(trendingData.keywords).length;
    document.getElementById('avg-sentiment').textContent = sentimentData.average_sentiment.toFixed(2);
    document.getElementById('total-posts').textContent = trendingData.total_posts;
    document.getElementById('courses-count').textContent = coursesData.length;
}

function displayTrendingPosts(posts) {
    const container = document.getElementById('trending-posts');
    
    if (!posts || posts.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center">No trending posts available</p>';
        return;
    }

    const postsHTML = posts.map(post => `
        <div class="border-l-4 border-purple-500 pl-4 py-2">
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <h4 class="font-semibold text-gray-800 mb-1">
                        <a href="${post.url}" target="_blank" class="hover:text-purple-600">
                            ${post.title}
                        </a>
                    </h4>
                    <p class="text-sm text-gray-600 mb-2">${post.content.substring(0, 100)}...</p>
                    <div class="flex items-center space-x-4 text-xs text-gray-500">
                        <span><i class="fas fa-arrow-up mr-1"></i>${post.score}</span>
                        <span><i class="fas fa-comments mr-1"></i>${post.num_comments}</span>
                        <span class="bg-purple-100 text-purple-800 px-2 py-1 rounded">r/${post.subreddit}</span>
                        <span class="sentiment-badge ${getSentimentClass(post.sentiment.combined)}">
                            ${getSentimentLabel(post.sentiment.combined)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = postsHTML;
}

function createWordCloud(keywords) {
    const container = document.getElementById('keywords-cloud');
    
    if (!keywords || Object.keys(keywords).length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center">No keywords available</p>';
        return;
    }

    // Clear previous word cloud
    container.innerHTML = '';

    // Prepare data for word cloud
    const words = Object.entries(keywords).map(([text, size]) => ({
        text,
        size: Math.max(12, size * 2)
    }));

    // Create word cloud
    if (typeof WordCloud !== 'undefined') {
        WordCloud(container, {
            list: words,
            gridSize: 16,
            weightFactor: 10,
            fontFamily: 'Hiragino Sans GB, Microsoft YaHei',
            color: 'random-dark',
            rotateRatio: 0.5,
            backgroundColor: 'white'
        });
    } else {
        // Fallback display
        const wordsHTML = words.slice(0, 10).map(word => 
            `<span class="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded mr-2 mb-2 text-sm">${word.text}</span>`
        ).join('');
        container.innerHTML = wordsHTML;
    }
}

// Insights Functions
async function loadInsightsData() {
    try {
        const sentimentData = await fetchAPI('/sentiment');
        createSentimentCharts(sentimentData);
        displaySentimentDetails(sentimentData);
    } catch (error) {
        console.error('Error loading insights data:', error);
        showError('Failed to load insights data');
    }
}

function createSentimentCharts(sentimentData) {
    // Sentiment Distribution Chart
    const sentimentCtx = document.getElementById('sentiment-chart').getContext('2d');
    if (charts.sentiment) {
        charts.sentiment.destroy();
    }
    
    charts.sentiment = new Chart(sentimentCtx, {
        type: 'doughnut',
        data: {
            labels: ['Positive', 'Neutral', 'Negative'],
            datasets: [{
                data: [
                    sentimentData.sentiment_distribution.positive,
                    sentimentData.sentiment_distribution.neutral,
                    sentimentData.sentiment_distribution.negative
                ],
                backgroundColor: ['#10B981', '#6B7280', '#EF4444'],
                borderColor: ['#059669', '#4B5563', '#DC2626'],
                borderWidth: 2,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    borderColor: '#8B5CF6',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: true
                }
            },
            cutout: '60%'
        }
    });

    // Sentiment Timeline Chart
    const timelineCtx = document.getElementById('sentiment-timeline').getContext('2d');
    if (charts.timeline) {
        charts.timeline.destroy();
    }

    // Create sample timeline data (in real app, you'd have time-series data)
    const timelineData = sentimentData.sentiment_scores.slice(0, 20);
    const labels = timelineData.map((_, index) => `Post ${index + 1}`);

    charts.timeline = new Chart(timelineCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Sentiment Score',
                data: timelineData,
                borderColor: '#8B5CF6',
                backgroundColor: 'rgba(139, 92, 246, 0.2)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#8B5CF6',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    max: 1,
                    min: -1,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 11
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    borderColor: '#8B5CF6',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: false
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

function displaySentimentDetails(sentimentData) {
    // Update stats cards
    document.getElementById('positive-count').textContent = sentimentData.sentiment_distribution.positive;
    document.getElementById('neutral-count').textContent = sentimentData.sentiment_distribution.neutral;
    document.getElementById('negative-count').textContent = sentimentData.sentiment_distribution.negative;
    document.getElementById('avg-sentiment-display').textContent = (sentimentData.average_sentiment * 100).toFixed(1) + '%';
    
    // Calculate additional metrics
    const scores = sentimentData.sentiment_scores;
    const maxSentiment = Math.max(...scores);
    const minSentiment = Math.min(...scores);
    const sentimentRange = (maxSentiment - minSentiment).toFixed(3);
    
    // Update additional insights
    document.getElementById('max-sentiment').textContent = maxSentiment.toFixed(3);
    document.getElementById('min-sentiment').textContent = minSentiment.toFixed(3);
    document.getElementById('sentiment-range').textContent = sentimentRange;
}

// Courses Functions
async function loadCoursesData() {
    try {
        const coursesData = await fetchAPI('/courses');
        displayCourses(coursesData);
    } catch (error) {
        console.error('Error loading courses data:', error);
        showError('Failed to load courses data');
    }
}

function displayCourses(courses) {
    const container = document.getElementById('courses-grid');
    
    if (!courses || courses.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center col-span-full">No courses available</p>';
        return;
    }

    const coursesHTML = courses.map(course => `
        <div class="bg-white rounded-lg shadow-md overflow-hidden card-hover">
            <div class="p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold text-gray-800">${course.title}</h3>
                    <span class="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">${course.category}</span>
                </div>
                <div class="space-y-2 mb-4">
                    <div class="flex items-center text-sm text-gray-600">
                        <i class="fas fa-star text-yellow-400 mr-1"></i>
                        <span>${course.rating}/5.0</span>
                    </div>
                    <div class="flex items-center text-sm text-gray-600">
                        <i class="fas fa-users mr-1"></i>
                        <span>${course.students.toLocaleString()} students</span>
                    </div>
                    <div class="flex items-center text-sm text-gray-600">
                        <i class="fas fa-tag mr-1"></i>
                        <span>${course.price}</span>
                    </div>
                </div>
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-500">${course.platform}</span>
                    <a href="${course.url}" target="_blank" class="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition duration-300">
                        View Course
                    </a>
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = coursesHTML;
}

// Utility Functions
function getSentimentClass(sentiment) {
    if (sentiment > 0.1) return 'bg-green-100 text-green-800';
    if (sentiment < -0.1) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
}

function getSentimentLabel(sentiment) {
    if (sentiment > 0.1) return 'Positive';
    if (sentiment < -0.1) return 'Negative';
    return 'Neutral';
}

function showError(message) {
    // Create error notification
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded shadow-lg z-50';
    errorDiv.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-exclamation-triangle mr-2"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(errorDiv);
    
    // Remove after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
}

// Auto-refresh functionality
setInterval(() => {
    const currentPage = document.querySelector('.page-section:not(.hidden)').id;
    if (currentPage === 'dashboard') {
        loadDashboardData();
    }
}, 300000); // Refresh every 5 minutes 