#!/usr/bin/env node

/**
 * Homepage Health Check Script
 * Tests all homepage-related functionality for localhost and deployment
 */

const https = require('https');
const http = require('http');

class HomepageHealthChecker {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.results = [];
  }

  log(status, message, details = '') {
    const timestamp = new Date().toISOString();
    const result = { timestamp, status, message, details };
    this.results.push(result);
    
    const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${icon} [${timestamp}] ${message}${details ? ': ' + details : ''}`);
  }

  async makeRequest(endpoint, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, this.baseUrl);
      const isHttps = url.protocol === 'https:';
      const client = isHttps ? https : http;
      
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: method,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'HomepageHealthChecker/1.0'
        },
        timeout: 10000
      };

      if (body) {
        options.headers['Content-Type'] = 'application/json';
        options.headers['Content-Length'] = Buffer.byteLength(body);
      }

      const req = client.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = data ? JSON.parse(data) : {};
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: parsed
            });
          } catch (e) {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: data
            });
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (body) {
        req.write(body);
      }
      req.end();
    });
  }

  async testHomepageLoad() {
    try {
      this.log('INFO', 'Testing homepage load...');
      const response = await this.makeRequest('/');
      
      if (response.statusCode === 200) {
        this.log('PASS', 'Homepage loads successfully', `Status: ${response.statusCode}`);
        return true;
      } else {
        this.log('FAIL', 'Homepage failed to load', `Status: ${response.statusCode}`);
        return false;
      }
    } catch (error) {
      this.log('FAIL', 'Homepage load error', error.message);
      return false;
    }
  }

  async testAPIEndpoints() {
    const endpoints = [
      { path: '/api/posts', name: 'Posts API' },
      { path: '/api/categories', name: 'Categories API' },
      { path: '/api/contributors/top', name: 'Top Contributors API' },
    ];

    let allPassed = true;

    for (const endpoint of endpoints) {
      try {
        this.log('INFO', `Testing ${endpoint.name}...`);
        const response = await this.makeRequest(endpoint.path);
        
        if (response.statusCode === 200) {
          // Validate response structure
          if (endpoint.path === '/api/posts') {
            if (response.data.posts && Array.isArray(response.data.posts) && response.data.pagination) {
              this.log('PASS', `${endpoint.name} working correctly`, `${response.data.posts.length} posts loaded`);
            } else {
              this.log('FAIL', `${endpoint.name} invalid response structure`);
              allPassed = false;
            }
          } else if (endpoint.path === '/api/categories') {
            if (Array.isArray(response.data) && response.data.length > 0) {
              this.log('PASS', `${endpoint.name} working correctly`, `${response.data.length} categories loaded`);
            } else {
              this.log('FAIL', `${endpoint.name} invalid response structure`);
              allPassed = false;
            }
          } else if (endpoint.path === '/api/contributors/top') {
            if (Array.isArray(response.data)) {
              this.log('PASS', `${endpoint.name} working correctly`, `${response.data.length} contributors loaded`);
            } else {
              this.log('FAIL', `${endpoint.name} invalid response structure`);
              allPassed = false;
            }
          }
        } else {
          this.log('FAIL', `${endpoint.name} failed`, `Status: ${response.statusCode}`);
          allPassed = false;
        }
      } catch (error) {
        this.log('FAIL', `${endpoint.name} error`, error.message);
        allPassed = false;
      }
    }

    return allPassed;
  }

  async testSidebarLoadingStates() {
    try {
      this.log('INFO', 'Testing sidebar data loading...');
      
      // Test individual sidebar endpoints that we fixed
      const sidebarEndpoints = [
        '/api/categories',
        '/api/posts?limit=5&sortBy=upvotes&sortOrder=desc',
        '/api/contributors/top'
      ];

      let allPassed = true;

      for (const endpoint of sidebarEndpoints) {
        try {
          const response = await this.makeRequest(endpoint);
          
          if (response.statusCode === 200) {
            this.log('PASS', `Sidebar endpoint working`, endpoint);
          } else {
            this.log('FAIL', `Sidebar endpoint failed`, `${endpoint} - Status: ${response.statusCode}`);
            allPassed = false;
          }
        } catch (error) {
          this.log('FAIL', `Sidebar endpoint error`, `${endpoint} - ${error.message}`);
          allPassed = false;
        }
      }

      return allPassed;
    } catch (error) {
      this.log('FAIL', 'Sidebar testing error', error.message);
      return false;
    }
  }

  async testPagination() {
    try {
      this.log('INFO', 'Testing pagination...');
      
      // Test first page
      const page1 = await this.makeRequest('/api/posts?page=1&limit=5');
      if (page1.statusCode !== 200) {
        this.log('FAIL', 'Pagination page 1 failed', `Status: ${page1.statusCode}`);
        return false;
      }

      // Test second page if there are enough posts
      if (page1.data.pagination && page1.data.pagination.pages > 1) {
        const page2 = await this.makeRequest('/api/posts?page=2&limit=5');
        if (page2.statusCode === 200) {
          this.log('PASS', 'Pagination working correctly');
          return true;
        } else {
          this.log('FAIL', 'Pagination page 2 failed', `Status: ${page2.statusCode}`);
          return false;
        }
      } else {
        this.log('PASS', 'Pagination working (only one page available)');
        return true;
      }
    } catch (error) {
      this.log('FAIL', 'Pagination test error', error.message);
      return false;
    }
  }

  async testDatabaseConnection() {
    try {
      this.log('INFO', 'Testing database connection via health check...');
      
      // Test if APIs respond (indicating database is accessible)
      const response = await this.makeRequest('/api/categories');
      
      if (response.statusCode === 200 && Array.isArray(response.data)) {
        this.log('PASS', 'Database connection working');
        return true;
      } else {
        this.log('FAIL', 'Database connection issues', `Categories API returned: ${response.statusCode}`);
        return false;
      }
    } catch (error) {
      this.log('FAIL', 'Database connection test error', error.message);
      return false;
    }
  }

  async runHealthCheck() {
    console.log(`\n🏥 Homepage Health Check Starting for: ${this.baseUrl}`);
    console.log(`📅 ${new Date().toISOString()}\n`);

    const tests = [
      { name: 'Homepage Load', fn: () => this.testHomepageLoad() },
      { name: 'Database Connection', fn: () => this.testDatabaseConnection() },
      { name: 'API Endpoints', fn: () => this.testAPIEndpoints() },
      { name: 'Sidebar Loading', fn: () => this.testSidebarLoadingStates() },
      { name: 'Pagination', fn: () => this.testPagination() }
    ];

    let totalTests = 0;
    let passedTests = 0;

    for (const test of tests) {
      totalTests++;
      console.log(`\n📋 Running: ${test.name}`);
      const result = await test.fn();
      if (result) passedTests++;
    }

    console.log(`\n📊 Health Check Summary:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${passedTests}`);
    console.log(`   Failed: ${totalTests - passedTests}`);
    console.log(`   Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);

    if (passedTests === totalTests) {
      console.log(`\n✅ All tests passed! Homepage is healthy.`);
    } else {
      console.log(`\n⚠️  Some tests failed. Please check the issues above.`);
    }

    return {
      total: totalTests,
      passed: passedTests,
      failed: totalTests - passedTests,
      successRate: Math.round((passedTests / totalTests) * 100),
      allPassed: passedTests === totalTests,
      results: this.results
    };
  }
}

// CLI usage
if (require.main === module) {
  const baseUrl = process.argv[2] || 'http://localhost:3000';
  
  const checker = new HomepageHealthChecker(baseUrl);
  checker.runHealthCheck()
    .then(summary => {
      process.exit(summary.allPassed ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Health check failed:', error);
      process.exit(1);
    });
}

module.exports = HomepageHealthChecker;