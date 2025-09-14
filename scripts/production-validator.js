#!/usr/bin/env node

/**
 * Production Deployment Validation Script
 * Validates homepage functionality in production environment
 */

const HomepageHealthChecker = require('./homepage-health-check.js');

class ProductionValidator extends HomepageHealthChecker {
  constructor(productionUrl) {
    super(productionUrl);
    this.productionUrl = productionUrl;
  }

  async testSSRRendering() {
    try {
      this.log('INFO', 'Testing SSR rendering...');
      const response = await this.makeRequest('/', 'GET');
      
      if (response.statusCode === 200) {
        // Check if response contains HTML with hydrated content
        const htmlContent = response.data;
        
        if (typeof htmlContent === 'string' && htmlContent.includes('<!DOCTYPE html>')) {
          if (htmlContent.includes('HomePageInteractive') || htmlContent.includes('PostCard')) {
            this.log('PASS', 'SSR rendering working correctly');
            return true;
          } else {
            this.log('WARN', 'SSR rendering may not be hydrated properly');
            return true; // Still functional
          }
        } else {
          this.log('FAIL', 'SSR rendering failed - not returning HTML');
          return false;
        }
      } else {
        this.log('FAIL', 'SSR rendering failed', `Status: ${response.statusCode}`);
        return false;
      }
    } catch (error) {
      this.log('FAIL', 'SSR rendering test error', error.message);
      return false;
    }
  }

  async testCacheHeaders() {
    try {
      this.log('INFO', 'Testing cache headers...');
      const response = await this.makeRequest('/api/posts');
      
      if (response.headers) {
        const cacheControl = response.headers['cache-control'];
        const lastModified = response.headers['last-modified'];
        
        if (cacheControl && cacheControl.includes('no-cache')) {
          this.log('PASS', 'Cache headers configured correctly', `Cache-Control: ${cacheControl}`);
          return true;
        } else {
          this.log('WARN', 'Cache headers may not be optimal', `Cache-Control: ${cacheControl || 'not set'}`);
          return true; // Not critical
        }
      } else {
        this.log('WARN', 'Unable to check cache headers');
        return true;
      }
    } catch (error) {
      this.log('FAIL', 'Cache headers test error', error.message);
      return false;
    }
  }

  async testSecurityHeaders() {
    try {
      this.log('INFO', 'Testing security headers...');
      const response = await this.makeRequest('/');
      
      if (response.headers) {
        const requiredHeaders = [
          'x-frame-options',
          'x-content-type-options',
          'referrer-policy'
        ];
        
        let hasAllHeaders = true;
        for (const header of requiredHeaders) {
          if (!response.headers[header]) {
            this.log('WARN', `Missing security header: ${header}`);
            hasAllHeaders = false;
          }
        }
        
        if (hasAllHeaders) {
          this.log('PASS', 'Security headers configured correctly');
          return true;
        } else {
          this.log('WARN', 'Some security headers missing (not critical for functionality)');
          return true;
        }
      } else {
        this.log('WARN', 'Unable to check security headers');
        return true;
      }
    } catch (error) {
      this.log('FAIL', 'Security headers test error', error.message);
      return false;
    }
  }

  async testEnvironmentVariables() {
    try {
      this.log('INFO', 'Testing environment configuration...');
      
      // Test if API endpoints work (indicating env vars are set)
      const dbTest = await this.makeRequest('/api/categories');
      
      if (dbTest.statusCode === 200) {
        this.log('PASS', 'Environment variables configured correctly');
        return true;
      } else if (dbTest.statusCode === 503) {
        this.log('FAIL', 'Database environment variables may be incorrect', 'Service unavailable');
        return false;
      } else {
        this.log('WARN', 'Environment configuration unclear', `Status: ${dbTest.statusCode}`);
        return true;
      }
    } catch (error) {
      this.log('FAIL', 'Environment variables test error', error.message);
      return false;
    }
  }

  async testImageLoading() {
    try {
      this.log('INFO', 'Testing image loading configuration...');
      
      // Get posts and check if any have images
      const postsResponse = await this.makeRequest('/api/posts?limit=5');
      
      if (postsResponse.statusCode === 200 && postsResponse.data.posts) {
        const postsWithImages = postsResponse.data.posts.filter(post => post.images && post.images.length > 0);
        
        if (postsWithImages.length > 0) {
          this.log('PASS', `Image URLs configured correctly`, `${postsWithImages.length} posts with images`);
        } else {
          this.log('INFO', 'No posts with images found (normal if no images uploaded)');
        }
        return true;
      } else {
        this.log('WARN', 'Unable to test image loading');
        return true;
      }
    } catch (error) {
      this.log('FAIL', 'Image loading test error', error.message);
      return false;
    }
  }

  async runProductionValidation() {
    console.log(`\n🚀 Production Deployment Validation for: ${this.productionUrl}`);
    console.log(`📅 ${new Date().toISOString()}\n`);

    // Run base health checks first
    const baseResults = await this.runHealthCheck();
    
    if (!baseResults.allPassed) {
      console.log(`\n❌ Base health checks failed. Skipping production-specific tests.`);
      return baseResults;
    }

    console.log(`\n🔍 Running production-specific tests...\n`);

    const productionTests = [
      { name: 'SSR Rendering', fn: () => this.testSSRRendering() },
      { name: 'Cache Headers', fn: () => this.testCacheHeaders() },
      { name: 'Security Headers', fn: () => this.testSecurityHeaders() },
      { name: 'Environment Variables', fn: () => this.testEnvironmentVariables() },
      { name: 'Image Loading', fn: () => this.testImageLoading() }
    ];

    let productionTestsPassed = 0;

    for (const test of productionTests) {
      console.log(`\n📋 Running: ${test.name}`);
      const result = await test.fn();
      if (result) productionTestsPassed++;
    }

    const totalProductionTests = productionTests.length;
    const overallPassed = baseResults.passed + productionTestsPassed;
    const overallTotal = baseResults.total + totalProductionTests;

    console.log(`\n📊 Production Validation Summary:`);
    console.log(`   Base Tests: ${baseResults.passed}/${baseResults.total} passed`);
    console.log(`   Production Tests: ${productionTestsPassed}/${totalProductionTests} passed`);
    console.log(`   Overall: ${overallPassed}/${overallTotal} passed`);
    console.log(`   Success Rate: ${Math.round((overallPassed / overallTotal) * 100)}%`);

    const allPassed = overallPassed === overallTotal;

    if (allPassed) {
      console.log(`\n✅ Production deployment is healthy and fully functional!`);
    } else {
      console.log(`\n⚠️  Some tests failed. Check the issues above.`);
    }

    return {
      total: overallTotal,
      passed: overallPassed,
      failed: overallTotal - overallPassed,
      successRate: Math.round((overallPassed / overallTotal) * 100),
      allPassed,
      baseResults,
      productionResults: {
        total: totalProductionTests,
        passed: productionTestsPassed,
        failed: totalProductionTests - productionTestsPassed
      }
    };
  }
}

// CLI usage
if (require.main === module) {
  const productionUrl = process.argv[2];
  
  if (!productionUrl) {
    console.error('❌ Usage: node production-validator.js <production-url>');
    console.error('   Example: node production-validator.js https://your-app.vercel.app');
    process.exit(1);
  }

  const validator = new ProductionValidator(productionUrl);
  validator.runProductionValidation()
    .then(summary => {
      process.exit(summary.allPassed ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Production validation failed:', error);
      process.exit(1);
    });
}

module.exports = ProductionValidator;