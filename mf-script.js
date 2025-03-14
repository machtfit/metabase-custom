// mf-script.js

/**********************************************************
 * 
 *  Dynamically add the external stylesheet link to the <head>
 *  Nov 2024 - Mathias Nitzsche
 * 
 **********************************************************/
function addMachtfitCss() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/metabase-custom/mf-style.css';
    document.head.appendChild(link);
}

/**********************************************************
 * 
 *  Save User ID into cookie, to allow accessing the value in nginx logs
 *  https://machtfit.atlassian.net/browse/DATA-1889
 *  Nov 2024 - Jonathan Fiebelkorn
 * 
 **********************************************************/
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

/**********************************************************
 * 
 *  Display the red notice based on the URL
 *  https://machtfit.atlassian.net/browse/DATA-1902
 *  Nov 2024 - Mathias Nitzsche, Jonathan Fiebelkorn
 * 
 **********************************************************/
function checkAndDisplayNotice() {
    // Check if the URL matches the pattern
    const regex = /\/question#/;

    if (regex.test(window.location.href)) {
        // Insert the notice within the header
        const targetElement = document.querySelector("header > div > div");
        if (targetElement && !document.querySelector('.mf-notice')) {
            // Create the notice div and set HTML content directly
            const noticeElement = document.createElement('div');
            noticeElement.className = 'mf-notice';
            // <h1 class="mf-headline">WARNING!</h1>
            noticeElement.innerHTML = `
                <p class="mf-message">This view is <i>unsaved</i> and <i>unmaintained</i>. If you need the data in the future please read <a href="https://machtfit.atlassian.net/wiki/spaces/DATA/pages/4687921298/Unsaved+Questions" target="_blank" title="Open Confluence">THIS</a>!</p>
            `;

            targetElement.insertAdjacentElement('afterend', noticeElement);
        }
    } else {
        // If the URL doesn't match, remove the notice if it's present
        const notice = document.querySelector('.mf-notice');
        if (notice) {
            notice.remove();
        }
    }
}

/**********************************************************
 * 
 *  Run code on SPA url change
 *  https://machtfit.atlassian.net/browse/DATA-1902
 *  Nov 2024 - Mathias Nitzsche, Jonathan Fiebelkorn
 * 
 **********************************************************/
function registerUrlChangeListener(urlChangeListenerFunction) {
    // Add event listeners for URL changes (SPA behavior)
    window.addEventListener('popstate', urlChangeListenerFunction);

    // Override pushState and replaceState to capture changes in SPA routing
    const originalPushState = history.pushState;
    history.pushState = function(state, title, url) {
        originalPushState.apply(this, arguments);
        urlChangeListenerFunction();
    };

    const originalReplaceState = history.replaceState;
    history.replaceState = function(state, title, url) {
        originalReplaceState.apply(this, arguments);
        urlChangeListenerFunction();
    };
}

/**********************************************************
 * 
 *  Filter PopUp Hover 
 * 
 **********************************************************/
function registerFilterHoverHack() {
    document.addEventListener('mouseover', (event) => {
        const popup = document.querySelector('.popover');  // Get the popup element
        const targetElement = document.querySelector("#Dashboard-Parameters-And-Cards-Container [data-testid='fixed-width-filters']");
        if (targetElement) {
            const isPopoverHovered = popup && (event.target === popup || popup.contains(event.target));
            targetElement.classList.toggle('hovered', isPopoverHovered);
        }
    });
}


/**********************************************************
 * 
 *  Allow Markdown Links everywhere (especially field descriptions)
 * 
 **********************************************************/
function registerMarkdownLinkConverter() {
    function convertMarkdownLinks(root = document) {
        const regex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;

        function processNode(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                let parent = node.parentNode;

                // Ignore input and textarea fields
                if (parent.tagName === "TEXTAREA" || parent.tagName === "INPUT") {
                    return;
                }

                let newContent = node.nodeValue;
                if (regex.test(newContent)) {
                    const tempDiv = document.createElement("div");
                    tempDiv.innerHTML = newContent.replace(
                        regex,
                        `<a href="$2" target="_blank" rel="noopener noreferrer" class="customer_markdown_links">$1</a>`
                    );

                    // Replace text node with new HTML
                    while (tempDiv.firstChild) {
                        parent.insertBefore(tempDiv.firstChild, node);
                    }
                    parent.removeChild(node);
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                // Skip inputs and textareas entirely
                if (node.tagName !== "TEXTAREA" && node.tagName !== "INPUT") {
                    node.childNodes.forEach(processNode);
                }
            }
        }

        processNode(root);
    }

    // MutationObserver to detect dynamically added content
    function observeMarkdownLinks() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        convertMarkdownLinks(node);
                    }
                });
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    // Run on page load
    convertMarkdownLinks(document.body);

    // Observe dynamically added content
    observeMarkdownLinks();

    // Re-run on URL change
    registerUrlChangeListener(() => {
        convertMarkdownLinks(document.body);
    });
}




/**********************************************************
 * 
 *  Execute on page load
 * 
 **********************************************************/
function initOnPageLoad() {
    addMachtfitCss();
    setUserIdCookie();
    checkAndDisplayNotice();
    registerFilterHoverHack();
    registerUrlChangeListener(() => {
        checkAndDisplayNotice();
    });

    registerMarkdownLinkConverter();
}

// Check the URL when the page loads
window.addEventListener("load", initOnPageLoad);
