const elementos = document.querySelectorAll('.scroll-item');

const observer = new IntersectionObserver(entries => {
	entries.forEach(entry => {
		if(entry.isIntersecting){
			entry.target.classList.add('visible');
		}
	});
},{
	threshold: 0.3
});

elementos.forEach(el => observer.observe(el));