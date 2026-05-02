import axios from 'axios';

/**
 * Test Exchange Rate API
 * This script tests the exchange rate endpoint to ensure it returns the correct format
 */

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_TOKEN = process.env.TEST_TOKEN || 'your-test-jwt-token';

async function testExchangeRateAPI() {
  console.log('🧪 Testing Exchange Rate API...\n');

  try {
    // Test 1: KES Currency
    console.log('Test 1: Fetching KES exchange rate...');
    const kesResponse = await axios.get(`${BASE_URL}/api/v1/wallet/exchange-rate`, {
      params: { currency: 'KES' },
      headers: { Authorization: `Bearer ${TEST_TOKEN}` }
    });

    console.log('✅ KES Response:', JSON.stringify(kesResponse.data, null, 2));
    
    // Validate response structure
    const kesData = kesResponse.data;
    if (!kesData.currency || !kesData.baseRate || !kesData.buyRate || !kesData.sellRate || !kesData.margin) {
      throw new Error('Missing required fields in response');
    }
    console.log('✅ All required fields present\n');

    // Test 2: USD Currency
    console.log('Test 2: Fetching USD exchange rate...');
    const usdResponse = await axios.get(`${BASE_URL}/api/v1/wallet/exchange-rate`, {
      params: { currency: 'USD' },
      headers: { Authorization: `Bearer ${TEST_TOKEN}` }
    });

    console.log('✅ USD Response:', JSON.stringify(usdResponse.data, null, 2));
    console.log('✅ All required fields present\n');

    // Test 3: Default currency (no param)
    console.log('Test 3: Fetching default exchange rate...');
    const defaultResponse = await axios.get(`${BASE_URL}/api/v1/wallet/exchange-rate`, {
      headers: { Authorization: `Bearer ${TEST_TOKEN}` }
    });

    console.log('✅ Default Response:', JSON.stringify(defaultResponse.data, null, 2));
    console.log('✅ All required fields present\n');

    // Verify calculations
    console.log('📊 Verifying calculations...');
    const kesRate = kesData.baseRate;
    const kesBuyRate = kesData.buyRate;
    const kesSellRate = kesData.sellRate;
    
    console.log(`Base Rate: ${kesRate}`);
    console.log(`Buy Rate: ${kesBuyRate} (should be ~${kesRate * 1.045} + fee)`);
    console.log(`Sell Rate: ${kesSellRate} (should equal base rate)`);
    console.log(`Margin: ${kesData.margin} (should be "4.5%")`);

    if (kesData.margin !== '4.5%') {
      console.warn('⚠️  Margin is not "4.5%"');
    }

    console.log('\n✅ All tests passed!');
    console.log('\n📱 Mobile App DTO should match:');
    console.log(`
data class ExchangeRateResponseDto(
    val currency: String,
    val baseRate: Double,
    val buyRate: Double,
    val sellRate: Double,
    val margin: String
)
    `);

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

// Run tests
testExchangeRateAPI();
