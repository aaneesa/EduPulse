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
    // Hide all pages with animation
    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.remove('active');
        section.classList.add('hidden');
    });

    // Show target page with animation
    const targetSection = document.getElementById(pageId);
    if (targetSection) {
        targetSection.classList.remove('hidden');
        // Trigger animation after a small delay
        setTimeout(() => {
            targetSection.classList.add('active');
        }, 50);
    }

    // Update active navigation with enhanced styling
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active', 'text-purple-600');
        link.classList.add('text-gray-700');
    });

    const activeLink = document.querySelector(`[href="#${pageId}"]`);
    if (activeLink) {
        activeLink.classList.remove('text-gray-700');
        activeLink.classList.add('text-purple-600', 'active');
    }

    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

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
        container.innerHTML = '<p class="text-gray-500 text-center py-8">No trending posts available</p>';
        return;
    }

    const postsHTML = posts.slice(0, 5).map((post, index) => {
        const sentimentClass = getSentimentClass(post.sentiment.combined);
        const sentimentLabel = getSentimentLabel(post.sentiment.combined);
        
        return `
            <div class="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border-l-4 ${sentimentClass} card-hover mb-4" style="animation-delay: ${index * 0.1}s;">
                <div class="flex justify-between items-start mb-3">
                    <h4 class="font-bold text-gray-800 line-clamp-2 text-lg flex-1">
                        <a href="${post.url}" target="_blank" class="hover:text-purple-600 transition-colors">
                            ${post.title}
                        </a>
                    </h4>
                    <span class="text-xs px-3 py-1 rounded-full ${sentimentClass} text-white ml-3 font-medium shadow-sm">
                        ${sentimentLabel}
                    </span>
                </div>
                <p class="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">${post.content.substring(0, 150)}...</p>
                <div class="flex justify-between items-center text-xs text-gray-500">
                    <span class="flex items-center">
                        <i class="fas fa-reddit mr-1"></i>
                        r/${post.subreddit}
                    </span>
                    <div class="flex items-center space-x-4">
                        <span class="flex items-center">
                            <i class="fas fa-arrow-up mr-1"></i>
                            ${post.score}
                        </span>
                        <span class="flex items-center">
                            <i class="fas fa-comments mr-1"></i>
                            ${post.num_comments}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

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
        container.innerHTML = '<p class="text-gray-500 text-center col-span-full py-12">No courses available</p>';
        return;
    }

    const coursesHTML = courses.map((course, index) => `
        <div class="bg-white rounded-2xl shadow-lg overflow-hidden card-hover" style="animation-delay: ${index * 0.1}s;">
            <div class="p-8">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-bold text-gray-800 line-clamp-2">${course.title}</h3>
                    <span class="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-sm">${course.category}</span>
                </div>
                <div class="space-y-3 mb-6">
                    <div class="flex items-center text-sm text-gray-600">
                        <div class="flex items-center mr-4">
                            <i class="fas fa-star text-yellow-400 mr-2"></i>
                            <span class="font-semibold">${course.rating}/5.0</span>
                        </div>
                        <div class="flex items-center">
                            <i class="fas fa-users mr-2"></i>
                            <span>${course.students.toLocaleString()} students</span>
                        </div>
                    </div>
                    <div class="flex items-center text-sm text-gray-600">
                        <i class="fas fa-tag mr-2"></i>
                        <span class="font-semibold text-green-600">${course.price}</span>
                    </div>
                    <div class="flex items-center text-sm text-gray-600">
                        <i class="fas fa-globe mr-2"></i>
                        <span>${course.platform}</span>
                    </div>
                </div>
                <div class="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span class="text-sm text-gray-500 flex items-center">
                        <i class="fas fa-external-link-alt mr-1"></i>
                        ${course.platform}
                    </span>
                    <a href="${course.url}" target="_blank" class="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                        <i class="fas fa-external-link-alt mr-2"></i>
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