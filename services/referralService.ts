
/**
 * Strict 'No Referral Hijacking' policy.
 * Only returns true if the URL is "clean" of known affiliate markers.
 */
export const shouldApplyReferral = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;
    
    // Comprehensive list of common affiliate/tracking parameters
    const affiliateMarkers = [
      'ref', 'tag', 'aff_id', 'affiliate', 'promo_id', 
      'click_id', 'clickid', 'irclickid', 'gclid', 
      'msclkid', 'partner', 'utm_source', 'source', 'ncid'
    ];
    
    return !affiliateMarkers.some(marker => params.has(marker));
  } catch (e) {
    return false;
  }
};

/**
 * Constructs the final URL with the community referral if safe.
 */
export const getProcessedUrl = (currentUrl: string, referralLinkTemplate: string | null): string | null => {
  if (!referralLinkTemplate || !shouldApplyReferral(currentUrl)) {
    return null;
  }

  const url = new URL(currentUrl);
  // If referralLinkTemplate is a full URL, we usually want to append parameters 
  // or redirect. For this extension, we assume the template is a set of query params.
  const separator = url.search ? '&' : '?';
  return `${currentUrl}${separator}${referralLinkTemplate}`;
};
