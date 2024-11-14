// logview.js

function setUserIdCookie(cookieValue) {
    const cookieName = "mb_uid";
    const daysUntilExpire = 365; // Cookie expires in  1 Year
    const d = new Date();
    d.setTime(d.getTime() + (daysUntilExpire * 24 * 60 * 60 * 1000));
    const expires = "expires=" + d.toUTCString();
    document.cookie = "${cookieName}=${cookieValue};${expires};path=/";
}

// Execute when the application has loaded
document.addEventListener("load", function() {
    const metabase_userid = window.Metabase.store.getState().currentUser.id || 0;
    setUserIdCookie(metabase_userid);
});
