import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        print("[AppDelegate] didFinishLaunchingWithOptions called with launchOptions: \(String(describing: launchOptions))")
        // 打印 UserDefaults 里常见的 auth 信息
        let defaults = UserDefaults.standard
        let osuAccessToken = defaults.string(forKey: "osu_access_token") ?? "nil"
        let osuRefreshToken = defaults.string(forKey: "osu_refresh_token") ?? "nil"
        let osuExpiresAt = defaults.object(forKey: "osu_expires_at") ?? "nil"
        let osuUserProfile = defaults.string(forKey: "osu_user_profile") ?? "nil"
        print("[AppDelegate][AuthDebug] osu_access_token: \(osuAccessToken)")
        print("[AppDelegate][AuthDebug] osu_refresh_token: \(osuRefreshToken)")
        print("[AppDelegate][AuthDebug] osu_expires_at: \(osuExpiresAt)")
        print("[AppDelegate][AuthDebug] osu_user_profile: \(osuUserProfile)")
        // Override point for customization after application launch.
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        print("[AppDelegate] applicationWillResignActive called")
        // 打印当前 UserDefaults 的 auth 信息
        let defaults = UserDefaults.standard
        print("[AppDelegate][AuthDebug] (ResignActive) osu_access_token: \(defaults.string(forKey: "osu_access_token") ?? "nil")")
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        print("[AppDelegate] applicationDidEnterBackground called")
        let defaults = UserDefaults.standard
        print("[AppDelegate][AuthDebug] (DidEnterBackground) osu_access_token: \(defaults.string(forKey: "osu_access_token") ?? "nil")")
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        print("[AppDelegate] applicationWillEnterForeground called")
        let defaults = UserDefaults.standard
        print("[AppDelegate][AuthDebug] (WillEnterForeground) osu_access_token: \(defaults.string(forKey: "osu_access_token") ?? "nil")")
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        print("[AppDelegate] applicationDidBecomeActive called")
        let defaults = UserDefaults.standard
        print("[AppDelegate][AuthDebug] (DidBecomeActive) osu_access_token: \(defaults.string(forKey: "osu_access_token") ?? "nil")")
    }

    func applicationWillTerminate(_ application: UIApplication) {
        print("[AppDelegate] applicationWillTerminate called")
        let defaults = UserDefaults.standard
        print("[AppDelegate][AuthDebug] (WillTerminate) osu_access_token: \(defaults.string(forKey: "osu_access_token") ?? "nil")")
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        print("[AppDelegate] application open URL called with: \(url.absoluteString), options: \(options)")
        let defaults = UserDefaults.standard
        print("[AppDelegate][AuthDebug] (OpenURL) osu_access_token: \(defaults.string(forKey: "osu_access_token") ?? "nil")")
        // 通知 Capacitor JS 层
        NotificationCenter.default.post(name: .capacitorOpenURL, object: [
            UIApplication.OpenURLOptionsKey.sourceApplication: options[UIApplication.OpenURLOptionsKey.sourceApplication] as Any,
            UIApplication.OpenURLOptionsKey.annotation: options[UIApplication.OpenURLOptionsKey.annotation] as Any,
            "url": url
        ])
        // 继续调用 Capacitor 的桥接方法
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        print("[AppDelegate] application continue userActivity called with: \(userActivity), restorationHandler: \(restorationHandler)")
        // 打印 userActivity 相关的 auth 信息
        let defaults = UserDefaults.standard
        print("[AppDelegate][AuthDebug] (ContinueUserActivity) osu_access_token: \(defaults.string(forKey: "osu_access_token") ?? "nil")")
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}
