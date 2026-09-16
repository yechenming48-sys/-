/* ============================================================
 * 玄机阁 · 用户与积分系统（纯前端 localStorage 演示版）
 * ------------------------------------------------------------
 * 功能：
 *   1. 注册 / 登录 / 退出
 *   2. 积分钱包（新用户赠送 10 积分）
 *   3. 每次占卜消耗 1 积分
 *   4. 每日签到 +3 积分
 *   5. 全局悬浮账户组件、登录弹窗、积分不足弹窗、Toast 提示
 *
 * 说明：本站为纯静态站点，登录与积分为浏览器本地演示，
 * 数据仅保存在本机 localStorage 中，不会上传服务器。
 * 密码仅做简单散列，切勿在真实项目中这样处理凭据。
 * ============================================================ */
(function () {
    'use strict';

    var USERS_KEY = 'xjg_users';
    var SESSION_KEY = 'xjg_session';
    var DEFAULT_POINTS = 10;
    var DAILY_BONUS = 3;
    var COST = 1;

    /* ---------- 本地存储工具 ---------- */
    function readJSON(key, fallback) {
        try {
            var raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (e) {
            return fallback;
        }
    }
    function writeJSON(key, val) {
        try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* ignore */ }
    }
    function readRaw(key) {
        try { return localStorage.getItem(key); } catch (e) { return null; }
    }
    function writeRaw(key, val) {
        try { localStorage.setItem(key, val); } catch (e) { /* ignore */ }
    }
    function removeRaw(key) {
        try { localStorage.removeItem(key); } catch (e) { /* ignore */ }
    }

    function getUsers() { return readJSON(USERS_KEY, {}); }
    function saveUsers(users) { writeJSON(USERS_KEY, users); }
    function getSessionName() { return readRaw(SESSION_KEY); }
    function setSessionName(name) { writeRaw(SESSION_KEY, name); }

    /* 简单字符串散列（仅演示用，非安全） */
    function hash(str) {
        var h = 5381;
        for (var i = 0; i < str.length; i++) {
            h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
        }
        return 'h' + h.toString(36);
    }

    function escapeHtml(str) {
        return String(str == null ? '' : str).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    /* 中英文文案 */
    function t(key, zh) {
        return (typeof I18N !== 'undefined' && I18N && I18N.t) ? I18N.t(key) : zh;
    }

    var pendingAction = null;

    var api = {
        getUser: function () {
            var name = getSessionName();
            if (!name) return null;
            var users = getUsers();
            var u = users[name];
            if (!u) { removeRaw(SESSION_KEY); return null; }
            return { username: name, points: u.points || 0, created: u.created, lastDaily: u.lastDaily };
        },
        isLoggedIn: function () { return !!this.getUser(); },
        getPoints: function () { var u = this.getUser(); return u ? u.points : 0; },

        register: function (username, password) {
            username = (username || '').trim();
            if (username.length < 2) return { ok: false, msg: t('auth.errUserShort', '用户名至少 2 个字符') };
            if (!password || password.length < 4) return { ok: false, msg: t('auth.errPassShort', '密码至少 4 位') };
            var users = getUsers();
            if (users[username]) return { ok: false, msg: t('auth.errUserExists', '该用户名已存在，请直接登录') };
            users[username] = {
                hash: hash(password),
                points: DEFAULT_POINTS,
                created: Date.now(),
                lastDaily: null,
                history: []
            };
            saveUsers(users);
            setSessionName(username);
            this._runPending();
            return { ok: true, msg: t('auth.msgRegisterOk', '注册成功，赠送 ' + DEFAULT_POINTS + ' 积分') };
        },

        login: function (username, password) {
            username = (username || '').trim();
            var users = getUsers();
            var u = users[username];
            if (!u) return { ok: false, msg: t('auth.errNoUser', '用户不存在，请先注册') };
            if (u.hash !== hash(password)) return { ok: false, msg: t('auth.errWrongPass', '密码错误') };
            setSessionName(username);
            this._runPending();
            return { ok: true, msg: t('auth.msgLoginOk', '欢迎回来，') + username };
        },

        logout: function () {
            removeRaw(SESSION_KEY);
            pendingAction = null;
        },

        addPoints: function (n) {
            var name = getSessionName();
            if (!name) return 0;
            var users = getUsers();
            var u = users[name];
            if (!u) return 0;
            u.points = (u.points || 0) + n;
            saveUsers(users);
            return u.points;
        },

        /* 消费积分：n 为消耗数量，action 为通过校验后要执行的占卜回调 */
        spendPoints: function (n, action) {
            n = n || COST;
            if (!this.isLoggedIn()) {
                pendingAction = (typeof action === 'function') ? action : null;
                this.toast(t('auth.msgLoginFirst', '请先登录，每次占卜消耗 ' + COST + ' 积分'));
                this.openLogin();
                return false;
            }
            if (this.getPoints() < n) {
                pendingAction = (typeof action === 'function') ? action : null;
                this.openRecharge();
                return false;
            }
            var name = getSessionName();
            var users = getUsers();
            var u = users[name];
            u.points = (u.points || 0) - n;
            u.history = u.history || [];
            u.history.push({ t: Date.now(), delta: -n, reason: '占卜' });
            saveUsers(users);
            this.refresh();
            this.toast(t('auth.msgSpent', '已消耗 ' + n + ' 积分，剩余 ') + u.points + ' ' + t('auth.points', '积分'));
            if (typeof action === 'function') setTimeout(action, 0);
            return true;
        },

        dailyCheckin: function () {
            var name = getSessionName();
            if (!name) { this.openLogin(); return { ok: false, msg: t('auth.errLoginFirst', '请先登录') }; }
            var users = getUsers();
            var u = users[name];
            if (!u) return { ok: false, msg: t('auth.errLoginFirst', '请先登录') };
            var today = new Date().toDateString();
            if (u.lastDaily === today) return { ok: false, msg: t('auth.errCheckedToday', '今天已经签到过啦') };
            u.lastDaily = today;
            u.points = (u.points || 0) + DAILY_BONUS;
            saveUsers(users);
            this.refresh();
            this._runPending();
            return { ok: true, msg: t('auth.msgCheckinOk', '签到成功 +' + DAILY_BONUS + ' 积分'), points: u.points };
        },

        _runPending: function () {
            if (!pendingAction) return false;
            if (this.isLoggedIn() && this.getPoints() >= COST) {
                var fn = pendingAction;
                pendingAction = null;
                setTimeout(fn, 0);
                return true;
            }
            if (this.isLoggedIn() && this.getPoints() < COST) {
                this.openRecharge();
            }
            return false;
        },

        /* ---------- UI 层 ---------- */
        toast: function (msg, type) {
            var box = document.getElementById('xjg-toasts');
            if (!box) return;
            var el = document.createElement('div');
            el.className = 'xjg-toast' + (type ? ' xjg-toast-' + type : '');
            el.textContent = msg;
            box.appendChild(el);
            requestAnimationFrame(function () { el.classList.add('show'); });
            setTimeout(function () {
                el.classList.remove('show');
                setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 350);
            }, 2600);
        },

        refresh: function () {
            var btn = document.getElementById('xjg-widget-btn');
            if (!btn) return;
            var panel = document.getElementById('xjg-panel');
            var user = this.getUser();
            if (user) {
                btn.classList.add('logged-in');
                btn.innerHTML =
                    '<span class="xjg-avatar">' + escapeHtml(user.username.charAt(0).toUpperCase()) + '</span>' +
                    '<span class="xjg-name">' + escapeHtml(user.username) + '</span>' +
                    '<span class="xjg-points">✦ ' + user.points + '</span>';
                if (panel) {
                    panel.innerHTML =
                        '<div class="xjg-panel-head">' +
                        '  <span class="xjg-panel-avatar">' + escapeHtml(user.username.charAt(0).toUpperCase()) + '</span>' +
                        '  <div><div class="xjg-panel-name">' + escapeHtml(user.username) + '</div>' +
                        '  <div class="xjg-panel-sub">' + t('auth.panelRole', '命理行者') + '</div></div>' +
                        '</div>' +
                        '<div class="xjg-panel-balance">' +
                        '  <span>' + t('auth.balance', '剩余积分') + '</span><strong>✦ ' + user.points + '</strong>' +
                        '</div>' +
                        '<p class="xjg-panel-tip">' + t('auth.panelTip', '每次占卜消耗 ' + COST + ' 积分，每日签到 +' + DAILY_BONUS) + '</p>' +
                        '<button class="xjg-panel-btn xjg-panel-btn-primary" id="xjg-checkin">' + t('auth.checkin', '每日签到 +' + DAILY_BONUS + ' 积分') + '</button>' +
                        '<button class="xjg-panel-btn" id="xjg-logout">' + t('auth.logout', '退出登录') + '</button>';
                    panel.querySelector('#xjg-checkin').addEventListener('click', function () {
                        api.dailyCheckin();
                    });
                    panel.querySelector('#xjg-logout').addEventListener('click', function () {
                        api.logout();
                        api.refresh();
                        api.closePanel();
                        api.toast(t('auth.msgLogout', '已退出登录'));
                    });
                }
            } else {
                btn.classList.remove('logged-in');
                btn.innerHTML = '<span class="xjg-avatar">✦</span><span class="xjg-widget-label">' + t('auth.login', '登录') + '</span>';
                if (panel) panel.innerHTML = '';
            }
        },

        openPanel: function () {
            var panel = document.getElementById('xjg-panel');
            if (!panel) return;
            if (!this.isLoggedIn()) { this.openLogin(); return; }
            this.refresh();
            panel.classList.toggle('open');
        },
        closePanel: function () {
            var panel = document.getElementById('xjg-panel');
            if (panel) panel.classList.remove('open');
        },

        openLogin: function (tab) {
            var overlay = document.getElementById('xjg-login-overlay');
            if (!overlay) return;
            overlay.classList.add('open');
            this.setLoginTab(tab || 'login');
            var input = document.getElementById('xjg-login-user') || document.getElementById('xjg-register-user');
            if (input) setTimeout(function () { input.focus(); }, 80);
        },
        openRecharge: function () {
            var overlay = document.getElementById('xjg-recharge-overlay');
            if (!overlay) return;
            var bal = document.getElementById('xjg-recharge-balance');
            if (bal) bal.textContent = this.getPoints();
            overlay.classList.add('open');
        },
        closeModals: function () {
            var o1 = document.getElementById('xjg-login-overlay');
            var o2 = document.getElementById('xjg-recharge-overlay');
            if (o1) o1.classList.remove('open');
            if (o2) o2.classList.remove('open');
        },
        setLoginTab: function (tab) {
            var overlay = document.getElementById('xjg-login-overlay');
            if (!overlay) return;
            var tabs = overlay.querySelectorAll('.xjg-tab');
            var loginForm = document.getElementById('xjg-login-form');
            var regForm = document.getElementById('xjg-register-form');
            tabs.forEach(function (t) {
                t.classList.toggle('active', t.getAttribute('data-tab') === tab);
            });
            if (loginForm) loginForm.hidden = (tab !== 'login');
            if (regForm) regForm.hidden = (tab !== 'register');
            var err = document.getElementById('xjg-login-error');
            if (err) err.textContent = '';
        },

        /* 注入全局 UI */
        mount: function () {
            if (document.getElementById('xjg-widget')) return;

            var widget = document.createElement('div');
            widget.id = 'xjg-widget';
            widget.className = 'xjg-widget';
            widget.innerHTML =
                '<button class="xjg-widget-btn" id="xjg-widget-btn" type="button">' +
                '  <span class="xjg-avatar">✦</span><span class="xjg-widget-label">登录</span>' +
                '</button>' +
                '<div class="xjg-panel" id="xjg-panel"></div>';

            var loginOverlay = document.createElement('div');
            loginOverlay.id = 'xjg-login-overlay';
            loginOverlay.className = 'xjg-overlay';
            loginOverlay.innerHTML =
                '<div class="xjg-modal">' +
                '  <button class="xjg-close" type="button" data-close aria-label="关闭">×</button>' +
                '  <div class="xjg-modal-head">' +
                '    <div class="xjg-modal-sigil">✦</div>' +
                '    <div><h3 data-i18n="auth.modalTitle">玄机阁 · 账户</h3><p data-i18n="auth.modalSub">登录后即可使用积分占卜</p></div>' +
                '  </div>' +
                '  <div class="xjg-tabs">' +
                '    <button class="xjg-tab active" type="button" data-tab="login" data-i18n="auth.login">登录</button>' +
                '    <button class="xjg-tab" type="button" data-tab="register" data-i18n="auth.register">注册</button>' +
                '  </div>' +
                '  <form id="xjg-login-form" autocomplete="off">' +
                '    <div class="xjg-field">' +
                '      <label data-i18n="auth.username">用户名</label>' +
                '      <input id="xjg-login-user" type="text" maxlength="16" placeholder="请输入用户名" data-i18n-placeholder="auth.usernamePh" required>' +
                '    </div>' +
                '    <div class="xjg-field">' +
                '      <label data-i18n="auth.password">密码</label>' +
                '      <input id="xjg-login-pass" type="password" maxlength="32" placeholder="请输入密码" data-i18n-placeholder="auth.passwordPh" required>' +
                '    </div>' +
                '    <button class="xjg-submit" type="submit" data-i18n="auth.submitLogin">登 录</button>' +
                '  </form>' +
                '  <form id="xjg-register-form" autocomplete="off" hidden>' +
                '    <div class="xjg-field">' +
                '      <label data-i18n="auth.username">用户名</label>' +
                '      <input id="xjg-register-user" type="text" maxlength="16" placeholder="2-16 个字符" data-i18n-placeholder="auth.usernamePhReg" required>' +
                '    </div>' +
                '    <div class="xjg-field">' +
                '      <label data-i18n="auth.password">密码</label>' +
                '      <input id="xjg-register-pass" type="password" maxlength="32" placeholder="至少 4 位" data-i18n-placeholder="auth.passwordPhReg" required>' +
                '    </div>' +
                '    <button class="xjg-submit" type="submit" data-i18n="auth.submitRegister">注册并领取 10 积分</button>' +
                '  </form>' +
                '  <p class="xjg-error" id="xjg-login-error"></p>' +
                '  <p class="xjg-modal-tip" data-i18n="auth.modalTip">新用户注册即送 10 积分 · 每次占卜消耗 1 积分 · 每日签到 +3 积分</p>' +
                '</div>';

            var rechargeOverlay = document.createElement('div');
            rechargeOverlay.id = 'xjg-recharge-overlay';
            rechargeOverlay.className = 'xjg-overlay';
            rechargeOverlay.innerHTML =
                '<div class="xjg-modal xjg-modal-sm">' +
                '  <button class="xjg-close" type="button" data-close aria-label="关闭">×</button>' +
                '  <div class="xjg-modal-head">' +
                '    <div class="xjg-modal-sigil">✦</div>' +
                '    <div><h3 data-i18n="auth.insufficient">积分不足</h3><p data-i18n="auth.insufficientSub">每次占卜需要 1 积分</p></div>' +
                '  </div>' +
                '  <div class="xjg-recharge-balance"><span data-i18n="auth.currentBalance">当前余额：</span><strong id="xjg-recharge-balance">0</strong> <span data-i18n="auth.points">积分</span></div>' +
                '  <button class="xjg-submit" id="xjg-recharge-checkin" type="button" data-i18n="auth.checkin">每日签到 +3 积分</button>' +
                '  <button class="xjg-submit xjg-submit-ghost" id="xjg-recharge-login" type="button" data-i18n="auth.goLogin">去登录</button>' +
                '  <p class="xjg-modal-tip" data-i18n="auth.localOnly">积分仅存于本机浏览器，用于解锁占卜体验</p>' +
                '</div>';

            var toasts = document.createElement('div');
            toasts.id = 'xjg-toasts';
            toasts.className = 'xjg-toasts';

            document.body.appendChild(widget);
            document.body.appendChild(loginOverlay);
            document.body.appendChild(rechargeOverlay);
            document.body.appendChild(toasts);

            /* 事件绑定 */
            document.getElementById('xjg-widget-btn').addEventListener('click', function () {
                api.openPanel();
            });

            document.addEventListener('click', function (e) {
                var panel = document.getElementById('xjg-panel');
                var widget = document.getElementById('xjg-widget');
                if (panel && widget && !widget.contains(e.target)) {
                    panel.classList.remove('open');
                }
            });

            loginOverlay.querySelectorAll('.xjg-tab').forEach(function (tab) {
                tab.addEventListener('click', function () {
                    api.setLoginTab(tab.getAttribute('data-tab'));
                });
            });

            loginOverlay.querySelectorAll('[data-close]').forEach(function (btn) {
                btn.addEventListener('click', function () { api.closeModals(); });
            });
            rechargeOverlay.querySelectorAll('[data-close]').forEach(function (btn) {
                btn.addEventListener('click', function () { api.closeModals(); });
            });

            [loginOverlay, rechargeOverlay].forEach(function (ov) {
                ov.addEventListener('click', function (e) {
                    if (e.target === ov) api.closeModals();
                });
            });

            function showError(msg) {
                var err = document.getElementById('xjg-login-error');
                if (err) err.textContent = msg || '';
            }

            document.getElementById('xjg-login-form').addEventListener('submit', function (e) {
                e.preventDefault();
                var u = document.getElementById('xjg-login-user').value;
                var p = document.getElementById('xjg-login-pass').value;
                var res = api.login(u, p);
                if (res.ok) {
                    api.closeModals();
                    api.refresh();
                    api.toast(res.msg);
                } else {
                    showError(res.msg);
                }
            });

            document.getElementById('xjg-register-form').addEventListener('submit', function (e) {
                e.preventDefault();
                var u = document.getElementById('xjg-register-user').value;
                var p = document.getElementById('xjg-register-pass').value;
                var res = api.register(u, p);
                if (res.ok) {
                    api.closeModals();
                    api.refresh();
                    api.toast(res.msg);
                } else {
                    showError(res.msg);
                }
            });

            document.getElementById('xjg-recharge-checkin').addEventListener('click', function () {
                var res = api.dailyCheckin();
                api.toast(res.msg, res.ok ? 'ok' : 'warn');
                if (res.ok) api.closeModals();
            });

            document.getElementById('xjg-recharge-login').addEventListener('click', function () {
                api.closeModals();
                api.openLogin();
            });

            document.addEventListener('keydown', function (e) {
                if (e.key === 'Escape') api.closeModals();
            });

            this.refresh();
        }
    };

    window.XJGAuth = api;

    function ready(fn) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn);
        } else {
            fn();
        }
    }
    ready(function () {
        api.mount();
        document.addEventListener('i18n:changed', function () { api.refresh(); });
    });
})();
