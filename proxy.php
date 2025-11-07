<?php

/**
 * RSS Feed Proxy
 * Fetches RSS feeds server-side to avoid CORS issues
 * Works locally AND when deployed
 */

// Enable CORS for all origins (allows embeds to work)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/xml; charset=UTF-8');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Get the feed URL from query parameter
$feedUrl = isset($_GET['url']) ? $_GET['url'] : '';

if (empty($feedUrl)) {
    http_response_code(400);
    echo '<?xml version="1.0"?><error>Missing url parameter</error>';
    exit;
}

// Validate URL
if (!filter_var($feedUrl, FILTER_VALIDATE_URL)) {
    http_response_code(400);
    echo '<?xml version="1.0"?><error>Invalid URL</error>';
    exit;
}

// Optional: Whitelist allowed domains for security
$allowedDomains = [
    'podcast.supersoul.top',
    'democracynow.org',
    'wpfwfm.org',
    'podbean.com',
    'archive.org',
    'libsyn.com',
    'simplecast.com',
    // Add more as needed
];

$parsedUrl = parse_url($feedUrl);
$domain = $parsedUrl['host'] ?? '';

// Check if domain is in whitelist (comment out to allow all domains)
$domainAllowed = false;
foreach ($allowedDomains as $allowedDomain) {
    if (stripos($domain, $allowedDomain) !== false) {
        $domainAllowed = true;
        break;
    }
}

if (!$domainAllowed) {
    http_response_code(403);
    echo '<?xml version="1.0"?><error>Domain not allowed</error>';
    exit;
}

// Initialize cURL
$ch = curl_init();

// Set cURL options
curl_setopt_array($ch, [
    CURLOPT_URL => $feedUrl,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_MAXREDIRS => 5,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_USERAGENT => 'Podcast Player/1.0 (RSS Feed Aggregator)',
    CURLOPT_HTTPHEADER => [
        'Accept: application/rss+xml, application/xml, text/xml, */*'
    ]
]);

// Execute request
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);

curl_close($ch);

// Handle errors
if ($response === false || $httpCode !== 200) {
    http_response_code($httpCode ?: 500);
    $errorMsg = $error ?: 'Failed to fetch feed';
    echo '<?xml version="1.0"?><error>' . htmlspecialchars($errorMsg) . '</error>';
    exit;
}

// Return the feed
echo $response;
