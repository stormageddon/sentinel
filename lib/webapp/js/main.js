/**
 * Created by mcaputo on 12/4/16.
 */

function submitSite() {
    var url = $('#urlInput').val();
    var siteName = $('#siteName').val();
    console.log('site: ', url);

    if (!siteName) {
        showError('Name is required');
        return;
    }

    if (!url) {
        showError('URL is required');
        return;
    }


    var isValidUrl = hasHttp(url);
    if (!isValidUrl) {
        url = 'http://' + url;
    }

    var data = { name: siteName, url: url};

    console.log('data:', data);

    $.ajax({
        type: 'POST',
        url : 'http://localhost:9375/site',
        data: data,
        success: function(response, data, err) {
            console.log('response:', response);
            console.log('data:', data);
            console.log('err:', err);

            // Show success message
            $('#save-alert-success').css('visibility', 'visible');
            $('#save-alert-success').css('opacity', '1.0');
        },
        error: showError,
        dataType: 'json'
    })

}

function hasHttp(url) {
    return url.slice(0, 4).indexOf('http') >= 0;
}

function showError(err) {
    $('#save-alert-success').css('display', 'none');
    $('#save-alert-danger').css('display', 'block');
    $('#save-alert-danger').css('visibility', 'visible');
    $('#save-alert-danger').css('opacity', '1.0');
    $('#save-alert-danger').text(err);
}