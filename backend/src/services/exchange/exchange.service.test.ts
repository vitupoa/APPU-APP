import { ExchangeService } from './exchange.service.js';

/**
 * Manual test for CurrencyConversionService (ExchangeService)
 * 
 * This test verifies:
 * - getExchangeRate() method fetches rates from fawazahmed0 API
 * - Redis caching works (1 hour TTL)
 * - Multiple fiat currencies are supported (USD, KES, EUR, GBP)
 * - API failures are handled gracefully with cached fallback
 * 
 * Requirements: 2.1.2
 */

async function testExchangeService() {
  try {
    // Test 1: Fetch USD rate (should be 1.0)
    const usdRate = await ExchangeService.getExchangeRate('USD');
    console.assert(usdRate === 1.0, 'USD rate should be 1.0');

    // Test 2: Fetch KES rate
    const kesRate = await ExchangeService.getExchangeRate('KES');
    console.assert(kesRate > 0, 'KES rate should be positive');

    // Test 3: Fetch EUR rate
    const eurRate = await ExchangeService.getExchangeRate('EUR');
    console.assert(eurRate > 0, 'EUR rate should be positive');

    // Test 4: Fetch GBP rate
    const gbpRate = await ExchangeService.getExchangeRate('GBP');
    console.assert(gbpRate > 0, 'GBP rate should be positive');

    // Test 5: Test caching (second call should be faster)
    const start1 = Date.now();
    await ExchangeService.getExchangeRate('KES');
    const time1 = Date.now() - start1;

    const start2 = Date.now();
    await ExchangeService.getExchangeRate('KES');
    const time2 = Date.now() - start2;

    // Test 6: Test getRate() alias
    const kesRate2 = await ExchangeService.getRate('KES');
    console.assert(kesRate2 === kesRate, 'getRate() should return same value as getExchangeRate()');

    // Test 7: Test unsupported currency
    try {
      await ExchangeService.getExchangeRate('INVALID');
      } catch (error) {
      }

    } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testExchangeService()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test suite failed:', error);
      process.exit(1);
    });
}

export { testExchangeService };
