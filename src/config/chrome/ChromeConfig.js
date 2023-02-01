var args = [
    '-wait-for-browser'
    ,'--no-sandbox'
    ,'--disable-setuid-sandbox'
    ,'--allow-failed-policy-fetch-for-test'
    ,'--disable-infobars'
    ,'--ignore-certifcate-errors'
    ,'--ignore-certifcate-errors-spki-list'
    ,'--hide-scrollbars'
    ,'--disable-extensions'
    ,'--disable-dev-shm-usage'
    ,'--start-maximized'
    ,'--disable-web-security'
    ,'--disable-features=IsolateOrigins,site-per-process'
    ,'--disable-blink-features=AutomationControlled'
    ,'--window-size=1920,1080'
    ,'--proxy-server=zproxy.lum-superproxy.io:22225'
    // ,'--proxy-server=14.63.194.174:8080'
]

exports.options = {
    args,
    headless: false,
    ignoreHTTPSErrors: true,
    defaultViewport: null,
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    //executablePath: "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe", //for window
    //executablePath: "/usr/bin/google-chrome-stable", //for deploy

    userDataDir: '/Users/usr/git/wspider_node/puppet_profile/detail'
    // product: "chrome"
};

exports.navigatorSet = async function (page) {
    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
            get: () => false
        })
        Object.defineProperty(navigator, 'plugins', {
            get: () => [1, 2, 3, 4]
        })
        Object.defineProperty(navigator, 'languages', {
            get: () => ["ko-KR", "ko", "en-US", "en", "zh-TW"]
        })
        Object.defineProperty(navigator, 'tax_vi', {
            get: () => "a7224d0774f7bf628fe6fdf46640346c"
        })

        window.navigator.chrome = {
            runtime: {}
        };
    
        const originalQuery = window.navigator.permissions.query
        // @ts-ignore
        return window.navigator.permissions.query = (parameters) => (
            parameters.name === 'notifications' ?
                Promise.resolve({ state: Notification.permission }) :
                originalQuery(parameters)
        )
    })
}

