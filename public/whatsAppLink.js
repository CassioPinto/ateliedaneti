// Function to detect device type
function getDeviceType() {
    const ua = navigator.userAgent.toLowerCase();
    return /mobile|android|iphone|ipad|tablet/i.test(ua) ? 'mobile' : 'desktop';
}

// Change href based on device type
var links = document.querySelectorAll('.whatsAppLink');
if (links) {
    let deviceType = getDeviceType();
    links.forEach(link => {
        link.href = deviceType === 'mobile' ? 'whatsapp://send?phone=5547999352244' : 'https://web.whatsapp.com/send?phone=5547999352244';
    });
}