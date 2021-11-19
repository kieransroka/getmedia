//Hides collapsable nav menu when view is changed
$('.navbar-nav>li>a').on('click', function(){
    $('.navbar-collapse').collapse('hide');
});