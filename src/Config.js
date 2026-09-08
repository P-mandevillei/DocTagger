/**
 * Replace these URLs after publishing the files in site/ on a verified domain
 * that you own. They must match the URLs entered in the OAuth consent screen
 * and Google Workspace Marketplace SDK.
 */
var DTI_PUBLIC_LINKS = {
  home: '',
  privacy: '',
  terms: '',
  support: '',
  deletion: '',
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
