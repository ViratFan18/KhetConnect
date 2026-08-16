package khetconnect.backend;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import khetconnect.backend.config.RateLimitFilter;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RateLimitFilterTest {

    @Test
    void shouldAllowAuthEndpointsWithoutRateLimiting() throws Exception {
        RateLimitFilter filter = new RateLimitFilter();
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        FilterChain chain = mock(FilterChain.class);

        when(request.getMethod()).thenReturn("POST");
        when(request.getRequestURI()).thenReturn("/api/v1/auth/login");
        when(request.getRemoteAddr()).thenReturn("127.0.0.1");

        assertDoesNotThrow(() -> filter.doFilter(request, response, chain));
        verify(chain).doFilter(request, response);
    }
}
