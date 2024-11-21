// logview.js

function setUserIdCookie() {
    if (window.Metabase.store.getState().currentUser === null) {
        setTimeout(setUserIdCookie, 1000);
        return;
    }
    const cookieValue = window.Metabase.store.getState().currentUser.id
    const cookieName = "mb_uid";
    const daysUntilExpire = 365; // Cookie expires in  1 Year
    const d = new Date();
    d.setTime(d.getTime() + (daysUntilExpire * 24 * 60 * 60 * 1000));
    const expires = "expires=" + d.toUTCString();
    document.cookie = `${cookieName}=${cookieValue};${expires};path=/`;
}

window.addEventListener("load", function() {
    setUserIdCookie();
});
