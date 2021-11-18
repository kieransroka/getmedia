// Declaring module
var app = angular.module("myApp", ["ngRoute"]);

// Config for ng-view 
// Title changes page title, template url changes html in ng-view
app.config(function ($routeProvider) {
    $routeProvider
        .when("/", {
            title: "Home",
            templateUrl: "landing.html"
        })
        .when("/search", {
            title: "Search",
            templateUrl: "search.html",
            controller: "iTunesController"
        })
        .when("/vouchers", {
            title: "Vouchers",
            templateUrl: "vouchers.html"
        })
        .when("/contact", {
            title: "Contact",
            templateUrl: "contact.html"
        })
})

// Code needed to change page title for ng-view
app.run(['$rootScope', function ($rootScope) {
    $rootScope.$on('$routeChangeSuccess', function (event, current, previous) {
        $rootScope.title = current.$$route.title;
    });
}]);

// Controller for changing active class on nav-links
app.controller("navController", function ($scope, $location) {
    $scope.isActive = function (viewLocation) {
        return viewLocation === $location.path();
    };
});

app.config(function ($sceDelegateProvider) {
    $sceDelegateProvider.resourceUrlWhitelist([
        "https://itunes.apple.com/**",
        'self'
    ]);
});


// Controller for itunes search, controller gets the view's scope and the http service.
app.controller("iTunesController", function ($scope, $https) {

    // Search function called when input is fired
    $scope.searchiTunes = function (artist) {
        // Spinner shows while search is happening
        $scope.spinner = true;
        // Search
        $https.jsonp('https://itunes.apple.com/search', {
            jsonpCallbackParam: 'callback',
            params: {
                'term': artist,
                'country': "GB",
                'attribute': "allArtistTerm",
                'limit': 200
            }
            // returns a promise. when returned, .then perform action..
        }).then(onSearchComplete, onError)
    }
    // Get the data out of the response when search succeeds.
    var onSearchComplete = function (response) {
        // the response has a few data elements
        // so we will grab all of that.
        $scope.data = response.data;
        // we will also store just the songs into
        // a separate variable for the view to iterate
        $scope.songs = response.data.results;
        // When search is complete, hide spinner
        $scope.spinner = false;
    }
    // if there's an error, store that for viewing.
    var onError = function (reason) {
        $scope.error = reason;
    }
});

// Directive that looks for screen width when window loads and also is resized
// Used with ng-class to change element styles and to alter length of artist names and song names in itunes search
app.directive('resizer', ['$window', function ($window) {
    function resizer(scope) {
        // Asigns either true or false depending on window width
        scope.isLarge = $window.innerWidth >= 1400 ? true : false;
        scope.isSmall = $window.innerWidth <= 1399 && $window.innerWidth >= 992 ? true : false;
        scope.isxSmall = $window.innerWidth <= 991 && $window.innerWidth >= 321 ? true : false;
        scope.isSmallMobile = $window.innerWidth <= 320 ? true : false;
        // Changes song name length and artist name length
        if (scope.isSmallMobile) {
            scope.songCount = 20;
            scope.artistCount = 28;
        } else if (scope.isxSmall) {
            scope.songCount = 33;
            scope.artistCount = 28;
        } else {
            scope.songCount = 40;
            scope.artistCount = 30;
        }
    }
    return {
        restrict: 'A',
        link: function (scope) {
            resizer(scope);
            // Looks for window resize
            angular.element($window).on('resize', function () {
                scope.$apply(function () {
                    resizer(scope);
                })
            });
        }
    }
}]);
// Custom filter used to eliminate bad results from itunes search
app.filter('order', function () {
    return function (results, text) {
        // Results is array returned from search
        // Sets search to equal value entered into input
        let search = text;
        if (!results) {
            return search;
        }
        //Sorts results
        return results.sort(function (results) {
            // Uses locale compare to compare what user input to artist names within results and assigns it to match
            var match = search.toLowerCase().localeCompare(results.artistName.toLowerCase());
            // If match is equal to 0 then what the user input is an exact match to artist name
            if (match == 0) {
                angular.forEach(results, function () {
                    // Adds new property to object named order, sets it to 1
                    // Order is then used in ng-repeat orderBy to order these results first as they are a direct match
                    results["order"] = 1;
                })
            } else {
                // Same as above but sets order to 2 and therefore is ordered second to direct matches in itunes results
                angular.forEach(results, function () {
                    results["order"] = 2;
                })
            };
        });
    }
});


//Create array used to store contents added to basket
let basketContent = [];
//Controller for handling basket
app.controller('basket', ['$scope', function ($scope) {
    //Hides initial view of basket
    $scope.init = true;
    //Hides basket
    $scope.show = false;
    //Adds scope to basket array
    $scope.basketContent = basketContent
    //function for showing empty basket message when basket is empty
    function basketEmpty() {
        //If basket empty shows message
        if ($scope.basketContent.length == 0) {
            $scope.emptyBasket = "Your Basket is Empty!"
        } else {
            $scope.emptyBasket = ""
        }
    }
    //Function to add items to basket
    function addToBasket(index, itemCounter) {
        //Adds itemCounter to selected item amount
        $scope.items[index].amount += itemCounter
        //Sets total to equal item amount multiplied by cost
        $scope.items[index].total = ($scope.items[index].amount * $scope.items[index].cost).toFixed(2);
        //Adds selected item to basket array
        $scope.basketContent.push($scope.items[index]);
        //Removes empty item error, if applicable
        $scope.items[index].error = ""
        //Removes initial hide of basket
        $scope.init = false
        //Shows basket
        $scope.show = true;
        //Adds total amount of items in basket together to display
        $scope.itemTotal = basketContent.reduce((n, {
            amount
        }) => n + amount, 0);
        //Adds up total cost of all items in basket to display
        $scope.costSubTotal = basketContent.map(p => p.cost * p.amount).reduce((a, b) => a + b).toFixed(2)
        //Outline is shown
        $scope.outline = true;
    }
    //Function used to work out cost of items in basket array when added or subtracted using + / - in basket
    function costs(itemAmount, index) {
        //Sets item in basket amount to equal new amount
        $scope.basketContent[index].amount = itemAmount;
        //Sets total to equal item amount multiplied by cost
        $scope.basketContent[index].total = ($scope.basketContent[index].amount * $scope.basketContent[index].cost).toFixed(2);
        //Adds total amount of items in basket together to display
        $scope.itemTotal = basketContent.reduce((n, {
            amount
        }) => n + amount, 0);
        //Adds up total cost of all items in basket to display
        $scope.costSubTotal = basketContent.map(p => p.cost * p.amount).reduce((a, b) => a + b).toFixed(2)
    }
    //All vouchers
    $scope.items = [{
            name: "£5 Voucher",
            amount: 0,
            counter: 0,
            img: "images/voucher5.jpeg",
            alt: "£5 iTunes Voucher",
            cost: 5,
            total: 0
        },
        {
            name: "£10 Voucher",
            amount: 0,
            counter: 0,
            img: "images/voucher10.jpeg",
            alt: "£10 iTunes Voucher",
            cost: 10,
            total: 0
        },
        {
            name: "£15 Voucher",
            amount: 0,
            counter: 0,
            img: "images/voucher15.jpeg",
            alt: "£15 iTunes Voucher",
            cost: 15,
            total: 0
        }
    ]
    //Function used to show/hide basket
    $scope.basketClick = function () {
        //Removes initial hide of basket
        $scope.init = false;
        //Toggles basket
        $scope.show = !$scope.show;
        //Toggles outline around basket to show if it is active or not
        if ($scope.show) {
            $scope.outline = true;
        } else {
            $scope.outline = false;
        }
        //Call function to check if basket is empty or not
        basketEmpty();
    };
    //Function used to close basket if clicked outside of when open
    $scope.basketClose = function () {
        if ($scope.show) {
            //Hides basket and hides outline
            $scope.show = false
            $scope.outline = false;
        }
    }
    //Function for subtracting voucher amount from input using button on voucher.html
    $scope.minusButton = function (itemCounter, index) {
        if (itemCounter > 0) {
            //If input is greater than 0 then subtract 1 and update counter amount
            itemCounter--;
            $scope.items[index].counter = itemCounter
        }
    };
    //Function for adding voucher amount from input using button on voucher.html
    $scope.plusButton = function (itemCounter, index) {
        if (itemCounter < 99) {
            //If input is less than 99 then add 1 and update counter amount
            itemCounter++;
            $scope.items[index].counter = itemCounter
        }
    };
    //Function for adding items to the basket when button clicked
    $scope.basketAdd = function (index, itemName, itemCounter) {
        //Sets arrayIndex to equal position of item in array
        let arrayIndex = $scope.basketContent.findIndex(e => e.name === itemName);
        //If the counter contains a value & the item is not found in the array then the item is added
        if ($scope.items[index].counter !== 0 && arrayIndex == -1) {
            addToBasket(index, itemCounter);
            //If the item is already in the array and contains a value, then the item is first removed from the array then added again to stop dupes
        } else if ($scope.items[index].counter !== 0) {
            $scope.basketContent.splice(arrayIndex, 1);
            addToBasket(index, itemCounter);
        } else {
            //If the counter does not contain a value
            $scope.items[index].error = "Please Enter an Amount!"
        }
        //Removes empty basket error if item is added
        basketEmpty();
    }
    //Function for minus button within basket
    $scope.basketMinus = function (itemAmount, index) {
        if (itemAmount > 1) {
            //If amount is greater than 1 then subtract 1 and call costs function to update
            itemAmount--;
            costs(itemAmount, index);
        }
    }
    //Function for plus button within basket
    $scope.basketPlus = function (itemAmount, index) {
        if (itemAmount < 99) {
            //If amount is less than 99 then add 1 and call costs function to update
            itemAmount++;
            costs(itemAmount, index);
        }
    }
    //Function to remove items from basket
    $scope.basketRemove = function (itemName) {
        //Sets arrayIndex to equal position of item in basket array
        let basketIndex = $scope.basketContent.findIndex(e => e.name === itemName);
        //Removes item from array
        $scope.basketContent.splice(basketIndex, 1);
        //Sets itemIndex to equal position of item in item 
        let itemIndex = $scope.items.findIndex(e => e.name === itemName);
        //Sets item amount to equal 0 again
        $scope.items[itemIndex].amount = 0;
        //Call basketEmpty to check if basket is now empty
        basketEmpty();
    }
}]);

//Controller for 'purchasing' item
app.controller('purchaseForm', ['$scope', function ($scope) {
    //Sets purchaseModal to equal purchase-modal bootstrap modal
    let purchaseModal = new bootstrap.Modal(document.getElementById("purchase-modal"));
    //Sets receiptModal to equal receipt-modal bootstrap modal
    let receiptModal = new bootstrap.Modal(document.getElementById("receipt-modal"));
    //Create object that will hold all user info when form is submit
    $scope.master = {};
    //Function called when form is submit on purchaseModal
    $scope.submit = function (details) {
        //Copies source object details to master
        $scope.master = angular.copy(details);
        //Toggles purchase-modal off
        purchaseModal.toggle();
        //Toggles receipt-modal on
        receiptModal.toggle();
    };
    //Function called when receipt-modal is closed
    $scope.reset = function () {
        //Reloads window to reset basket etc.
        window.location.reload();
    }
}]);
//Controller for the contact form on contact.html
app.controller('contactForm', ['$scope', function ($scope) {
    //Sets contactModal to equal contact-modal bootstrap modal
    let contactModal = new bootstrap.Modal(document.getElementById("contact-modal"));
    //When contact form is submit contat-modal is toggled on
    $scope.submit = function () {
        contactModal.toggle();
    }
    //Function resets form when modal is exited
    $scope.reset = function () {
        document.getElementById("contact-form").reset();
    }
}]);