/**
 * These URLs point to the public pages published from docs/ on the verified
 * production domain. They must match the URLs entered in the OAuth consent screen
 * and Google Workspace Marketplace SDK.
 */
var DTI_PUBLIC_LINKS = {
  home: 'https://doctagger.org/',
  privacy: 'https://doctagger.org/privacy.html',
  terms: 'https://doctagger.org/terms.html',
  support: 'https://doctagger.org/support.html',
  deletion: 'https://doctagger.org/delete-data.html',
};

function getPublicLinks() {
  return {
    home: DTI_PUBLIC_LINKS.home,
    privacy: DTI_PUBLIC_LINKS.privacy,
    terms: DTI_PUBLIC_LINKS.terms,
    support: DTI_PUBLIC_LINKS.support,
    deletion: DTI_PUBLIC_LINKS.deletion,
  };
}
