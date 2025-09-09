const homeLink = document.getElementById('home-link');
const slimeLink = document.getElementById('slimecoin-link');
const homeSection = document.getElementById('home-section');
const slimeSection = document.getElementById('slimecoin-section');

function showSection(section) {
  homeSection.classList.remove('active');
  slimeSection.classList.remove('active');
  section.classList.add('active');
}

function setActiveLink(link) {
  homeLink.classList.remove('active');
  slimeLink.classList.remove('active');
  link.classList.add('active');
}

homeLink.addEventListener('click', (e) => {
  e.preventDefault();
  showSection(homeSection);
  setActiveLink(homeLink);
});

slimeLink.addEventListener('click', (e) => {
  e.preventDefault();
  showSection(slimeSection);
  setActiveLink(slimeLink);
});

// initialize
showSection(homeSection);
setActiveLink(homeLink);
