/* global dialogPolyfill addToHomescreen */

(function($) {
    'use strict';

    var app = {
        isLoading: true,
        settings: {
            name: 'Akinshola',
            surname: 'Samuel',
            email: 'akinsholasamuel@gmail.com'
        },
        cart: [],
        spinner: document.querySelector('.spinner'),
        pizzasListContainer: document.querySelector('.pizza-list'),
        pizzasList: document.querySelector('.pizza-list > ul'),
        pizzaListItemTemplate: document.querySelector('.pizzaListItemTemplate'),
        pizzaDialog: document.querySelector('dialog#pizza-dialog'),
        cartIcons: document.querySelectorAll('.cart-icon'),
        snackbar: document.querySelector('.mdl-snackbar'),
        cartDialog: document.querySelector('dialog#cart-dialog'),
        openCartButtons: document.querySelectorAll('.open-cart'),
        cartListItemTemplate: document.querySelector('.cartListItemTemplate'),
        sidebarCard: document.querySelector('.mdl-card'),
        userDetailsDialog: document.querySelector('dialog#user-details-dialog'),
        openUserDetailsButtons: document.querySelector('.open-user-details'),
        userDetailsSpinner: document.querySelector('dialog#user-details-dialog .mdl-spinner'),
    };

    if (!app.pizzaDialog.showModal) {
        dialogPolyfill.registerDialog(app.pizzaDialog);
    }

    app.pizzaDialog.querySelector('.close')
        .addEventListener('click', function() {
            app.closePizzaDialog();
        });

    if (!app.cartDialog.showModal) {
        dialogPolyfill.registerDialog(app.cartDialog);
    }

    app.cartDialog.querySelector('.close')
        .addEventListener('click', function() {
            app.cartDialog.close();
        });

    if (!app.userDetailsDialog.showModal) {
        dialogPolyfill.registerDialog(app.userDetailsDialog);
    }

    app.userDetailsDialog.querySelector('.close')
        .addEventListener('click', function() {
            app.closeUserDetailsDialog();
        });

    app.userDetailsDialog.querySelector('.save')
        .addEventListener('click', function() {
            var name = app.userDetailsDialog.querySelector('#name-field').value,
                surname = app.userDetailsDialog.querySelector('#surname-field').value,
                email = app.userDetailsDialog.querySelector('#email-field').value;

            app.settings.name = name;
            app.settings.surname = surname;
            app.settings.email = email;

            app.setSettings();

            var form = app.userDetailsDialog.querySelector('form');

            app.userDetailsSpinner.classList.add('is-active');
            form.setAttribute('hidden', true);
            app.registerEndpoint(app.subsribtion).then(function() {
                app.userDetailsSpinner.classList.remove('is-active');
                form.removeAttribute('hidden');
                app.closeUserDetailsDialog();
            }).catch(function(error) {
                alert(error.statusText);
                form.removeAttribute('hidden');
                app.userDetailsSpinner.classList.remove('is-active');
            });
        });

    for (var i = 0; i < app.openCartButtons.length; i++) {
        app.openCartButtons[i].addEventListener('click', function(event) {
            event.preventDefault();
            app.showCartDialog();
        });
    }

    app.setSettings = function() {
        app.sidebarCard.querySelector('.mdl-card__subtitle-text')
            .textContent = app.settings.email;

        var fullname = ''

        if (app.settings.name) {
            fullname += app.settings.name;
        }

        if (app.settings.surname) {
            fullname += ' ' + app.settings.surname;
        }

        app.sidebarCard.querySelector('.mdl-card__title-text > div')
            .textContent = fullname;
    }

    app.getPizzas = function() {
        var url = './api/pizzas.json';

        var request = new XMLHttpRequest();
        request.onreadystatechange = function() {
            if (request.readyState === XMLHttpRequest.DONE) {
                if (request.status === 200) {
                    var response = JSON.parse(request.response);
                    app.updatePizzasList(response);
                }
            }
        };
        request.open('GET', url);
        request.send();
    };

    var pizzaListItemClickEventListener = function(pizza) {
        return function() {
            app.showPizzaDialog(pizza);
        };
    };

    var pizzaListItemAddToCartClickEventListener = function(pizza) {
        return function(event) {
            event.preventDefault();
            app.addToCart(pizza);
        };
    };

    app.updatePizzasList = function(pizzas) {
        for (var i = 0; i < pizzas.length; i++) {
            var pizza = pizzas[i];
            var item = app.pizzaListItemTemplate.cloneNode(true);
            item.classList.remove('pizzaListItemTemplate');
            item.querySelector('.pizza-price').textContent
                                            = '₦' + pizza.price.toFixed(2);
            item.querySelector('.pizza-name').textContent = pizza.name;
            item.querySelector('.pizza-image')
                .setAttribute('src', './img/' + pizza.photo);
            item.querySelector('.mdl-list__item-primary-content')
                .addEventListener('click',
                                pizzaListItemClickEventListener(pizza));
            item.querySelector('.add-to-cart')
                .addEventListener('click',
                            pizzaListItemAddToCartClickEventListener(pizza));
            app.pizzasList.appendChild(item);
        }

        if (app.isLoading) {
            app.spinner.setAttribute('hidden', true);
            app.pizzasListContainer.removeAttribute('hidden');
            app.isLoading = false;
        }
    };

    app.showPizzaDialog = function(pizza) {
        var item = app.pizzaDialog;
        item.querySelector('.pizza-price').textContent
                                            = '₦' + pizza.price.toFixed(2);
        item.querySelector('.pizza-name').textContent = pizza.name;
        item.querySelector('.pizza-image')
            .setAttribute('src', './img/' + pizza.photo);

        var ingredients = pizza.ingredients.join(', ');
        item.querySelector('.pizza-ingredients').textContent = ingredients;

        app.dialogAddToCartHandler = function(event) {
            event.preventDefault();

            app.closePizzaDialog();
            app.addToCart(pizza);
        };
        item.querySelector('.add-to-cart')
            .addEventListener('click', app.dialogAddToCartHandler);

        app.pizzaDialog.showModal();
    };

    app.closePizzaDialog = function() {
        app.pizzaDialog.querySelector('.add-to-cart')
            .removeEventListener('click', app.dialogAddToCartHandler);
        delete app.dialogAddToCartHandler;
        app.pizzaDialog.close();
    };

    app.showCartDialog = function() {
        var cartList = app.cartDialog.querySelector('.cart-list');
        var oldItems = cartList.querySelectorAll('li');
        for (var i = 0; i < oldItems.length; i++) {
            cartList.removeChild(oldItems[i]);
        }

        for (i = 0; i < app.cart.length; i++) {
            var pizza = app.cart[i];
            var item = app.cartListItemTemplate.cloneNode(true);
            item.classList.remove('cartListItemTemplate');
            item.querySelector('.pizza-price').textContent
                                            = '₦' + pizza.price.toFixed(2);
            item.querySelector('.pizza-name').textContent = pizza.name;
            item.querySelector('.pizza-image')
                .setAttribute('src', './img/' + pizza.photo);

            cartList.appendChild(item);
        }

        var total = app.cart
            .map(function(pizza) {
                return pizza.price;
            })
            .reduce(function(a, b) {
                return a + b;
            }, 0.0);
        app.cartDialog.querySelector('.total-price').textContent
                                                = '₦' + total.toFixed(2);

        app.cartDialog.showModal();
    };

    app.updateCartIcon = function() {
        var count = app.cart.length;
        for (var i = 0; i < app.cartIcons.length; i++) {
            var cartIcon = app.cartIcons[i];
            cartIcon.setAttribute('data-badge', count);
            if (count) {
                cartIcon.classList.add('mdl-badge');
            } else {
                cartIcon.classList.remove('mdl-badge');
            }
        }
    };

    app.closeUserDetailsDialog = function() {
        app.userDetailsDialog.close();
    };

    app.openUserDetailsButtons.addEventListener('click', function() {
        var nameField = app.userDetailsDialog.querySelector('#name-field'),
            surnameField = app.userDetailsDialog.querySelector('#surname-field'),
            emailField = app.userDetailsDialog.querySelector('#email-field');

        nameField.parentElement.MaterialTextfield.change(app.settings.name);
        surnameField.parentElement.MaterialTextfield.change(app.settings.surname);
        emailField.parentElement.MaterialTextfield.change(app.settings.email);

        app.userDetailsDialog.showModal();
    });

    app.showSnackbar = function(data) {
        app.snackbar.MaterialSnackbar.showSnackbar(data);
    };

    app.addToCart = function(pizza) {
        app.cart.push(pizza);
        app.updateCartIcon();

        var handler = function() {
            var index = app.cart.indexOf(pizza);
            if (index >= 0) {
                app.cart.splice(index, 1);
                app.updateCartIcon();
            }
        };

        var data = {
            message: 'Added ' + pizza.name + ' to cart',
            timeout: 2000,
            actionHandler: handler,
            actionText: 'Undo'
        };
        app.showSnackbar(data);
    };

    app.registerEndpoint = function(endpointData) {
        var data = {
            endpointData: endpointData,
            userData: app.settings
        };

        return $.ajax({
            url: 'http://localhost:3010/subscribe',
            method: 'POST',
            data: JSON.stringify(data),
            contentType: "application/json",
        });
    };

    addToHomescreen();
    app.setSettings();
    app.getPizzas();

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker
            .register('/service-worker.js')
            .then(function() {
                return navigator.serviceWorker.ready;
            })
            .then(function(reg) {
                console.log('Service Worker is ready :^)', reg);
                reg.pushManager.subscribe({userVisibleOnly: true})
                    .then(function(sub) {
                        app.registerEndpoint(sub);
                        app.subsribtion = sub;
                    });
            }).catch(function(error) {
                console.log('Service Worker error :^(', error);
            });
    }
})(jQuery);
