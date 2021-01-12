var stripePublicKey = $('#id_stripe_public_key').text().slice(1, -1);
var clientSecret = $('#id_client_secret').text().slice(1, -1);
var stripe = Stripe(stripePublicKey);
var elements = stripe.elements();

var style = {
    base: {
        color: '#32325d',
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        '::placeholder': {
            color: '#aab7c4'
        }
    },
    invalid: {
        color: '#dc3545',
        iconColor: '#dc3545'
    }
};

var card = elements.create('card', { style: style });
card.mount('#card-element');

// EventListener that handles validation erro on #card-element
card.addEventListener('change', function (event) {
    var errorDiv = document.getElementById('card-errors');
    if (event.error) {
        var html = `
            <span class="icon" role="alert">
                <i class="fas fa-times"></i>
            </span>
            <span>${event.error.message}</span>
        `
        $(errorDiv).html(html);
    } else {
        errorDiv.textContent = '';
    }
})


/* Submit Stripe Client Code */
var form = document.getElementById('payment-form');

form.addEventListener('submit', function (ev) {
    ev.preventDefault();

    /* Preventing multiple submissions*/
    card.update({ 'disabled': true });
    $('#checkout-button').attr('disabled', true)
    /*** LoadingOverlay ***/
    $('#checkout-form').fadeToggle(100);
    $('#loading-overlay').fadeToggle(100)
    /*** End LoadingOverlay */

    /* Cache_Ceckout_Data */
    /* Save_info Box */
    var saveInfo = Boolean($('#save-info').attr('checked'))

    var csrfToken = $('input[name="csrfmiddlewaretoken"]').valueOf()
    var postData = {
        'csrfmiddlewaretoen': csrfToken,
        'client_secret': clientSecret,
        'save_info':saveInfo,
    }

    var url = '/checkout/cache_checkout_data/';

    $.post(url, postData).done(function(){
        stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: card,
                billing_details: {
                    name: $.trim(form.full_name.value),
                    phone: $.trim(form.phone_number.value),
                    email: $.trim(form.email.value),
                    address: {
                        line1: $.trim(form.street_line1.value),
                        line2: $.trim(form.street_lin2.value),
                        city: $.trim(form.city_or_town.value),
                        country: $.trim(form.country.value),
                        state: $.trim(form.county.value),
                    }
                }
            },
            billing_details: {
                name: $.trim(form.full_name.value),
                phone: $.trim(form.phone_number.value),
                address: {
                    line1: $.trim(form.street_line1.value),
                    line2: $.trim(form.street_lin2.value),
                    city: $.trim(form.city_or_town.value),
                    country: $.trim(form.country.value),
                    postal_code: $trim(form.postcode.value),
                    state: $.trim(form.county.value),
                }
            }
        }).then(function (result) {
            if (result.error) {
                // Show error to your customer (e.g., insufficient funds)
                // console.log(result.error.message);
                var errorDiv = document.getElementById('card-errors');
                var html = `
                    <span class="icon" role="alert">
                        <i class="fas fa-times"></i>
                    </span>
                    <span>${result.error.message}</span>
                `;
                $(errorDiv).html(html);
                /*** LoadingOverlay ***/
                $('#checkout-form').fadeToggle(100);
                $('#loading-overlay').fadeToggle(100)
                /*** End LoadingOverlay */
                card.update({ 'disabled': false });
                $('#checkout-button').attr('disabled', false)
            } else {
                // The payment has been processed!
                if (result.paymentIntent.status === 'succeeded') {
                    // Show a success message to your customer
                    // There's a risk of the customer closing the window before callback
                    // execution. Set up a webhook or plugin to listen for the
                    // payment_intent.succeeded event that handles any business critical
                    // post-payment actions.
                    form.submit();
                }
            }
        });
    }).fail(function(){
        // Just reload the page. The error message will be in django messages
        location.reload();
    });
});