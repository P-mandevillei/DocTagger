/**
 * Replace these URLs after publishing the files in site/ on a verified domain
 * that you own. They must match the URLs entered in the OAuth consent screen
 * and Google Workspace Marketplace SDK.
 */
var DTI_PUBLIC_LINKS = {
  home: 'https://p-mandevillei.github.io/DocTagger/index.html',
  privacy: 'https://p-mandevillei.github.io/DocTagger/privacy.html',
  terms: 'https://p-mandevillei.github.io/DocTagger/terms.html',
  support: 'https://p-mandevillei.github.io/DocTagger/support.html',
  deletion: 'https://p-mandevillei.github.io/DocTagger/delete-data.html',
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
