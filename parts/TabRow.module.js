/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const remote = __importStar(__webpack_require__(/*! @electron/remote */ "./node_modules/@electron/remote/renderer/index.js"));
const electron_1 = __webpack_require__(/*! electron */ "electron");
const lucide_react_1 = __webpack_require__(/*! lucide-react */ "./node_modules/lucide-react/dist/cjs/lucide-react.js");
const react_1 = __importDefault(__webpack_require__(/*! react */ "./node_modules/react/index.js"));
const react_beautiful_dnd_1 = __webpack_require__(/*! react-beautiful-dnd */ "./node_modules/react-beautiful-dnd/dist/react-beautiful-dnd.esm.js");
const styled_components_1 = __importDefault(__webpack_require__(/*! styled-components */ "./node_modules/styled-components/dist/styled-components.browser.esm.js"));
const GroupActionCreators_1 = __webpack_require__(/*! ../actions/GroupActionCreators */ "./ts/renderer/actions/GroupActionCreators.ts");
const IApp_1 = __webpack_require__(/*! ../domains/IApp */ "./ts/renderer/domains/IApp.ts");
const Notifications_1 = __webpack_require__(/*! ../domains/Notifications */ "./ts/renderer/domains/Notifications.ts");
const i18n_1 = __importDefault(__webpack_require__(/*! ../i18n */ "./ts/renderer/i18n/index.ts"));
const ISidebar_1 = __webpack_require__(/*! ../states/ISidebar */ "./ts/renderer/states/ISidebar.ts");
const ITabGroup_1 = __webpack_require__(/*! ../states/ITabGroup */ "./ts/renderer/states/ITabGroup.ts");
const Store_1 = __importDefault(__webpack_require__(/*! ../Store */ "./ts/renderer/Store.ts"));
const ContextMenu_1 = __webpack_require__(/*! ../utils/ContextMenu */ "./ts/renderer/utils/ContextMenu.ts");
const ImageUtils_1 = __webpack_require__(/*! ../utils/ImageUtils */ "./ts/renderer/utils/ImageUtils.ts");
const Urls_1 = __webpack_require__(/*! ../utils/Urls */ "./ts/renderer/utils/Urls.ts");
const EditTabDialog_1 = __webpack_require__(/*! ./EditTabDialog */ "./ts/renderer/components/EditTabDialog.tsx");
const msg = i18n_1.default.get().app;
const isIconOnlySidebar = (sidebar) => sidebar.width < ISidebar_1.sidebarIconOnlyWidth;
//#region styled
const Container = styled_components_1.default.li `
    box-sizing: border-box;
    margin: ${(p) => p.selected && isIconOnlySidebar(p.sidebar) ? '0 -1px' : '0'};
    padding: ${(p) => isIconOnlySidebar(p.sidebar) ? '7px 0px 8px 0px' : '7px 0px 8px 6px'};
    color: ${(p) => p.selected ? 'var(--chrome-tab-text-selected)' : 'var(--chrome-tab-text)'};
    background-color: ${(p) => p.selected ? 'var(--chrome-tab-selected-bg)' : 'transparent'};
    background-color: ${(p) => p.selected ? 'color-mix(in srgb, var(--chrome-tab-selected-bg) 82%, transparent)' : 'transparent'};
    font-weight: ${(p) => p.selected ? 'bold' : ''};
    border-radius: 15px;
    min-width: 18px;
    cursor: pointer;
    transition: background-color 0.12s ease, color 0.12s ease;
`;
const TabBody = styled_components_1.default.div `
    position: relative;
    display: flex;
    align-items: center;
    justify-content: ${(p) => isIconOnlySidebar(p.sidebar) ? 'center' : 'flex-start'};
    outline: none;
`;
const NotificationMark = styled_components_1.default.span `
    flex: ${(p) => isIconOnlySidebar(p.sidebar) ? 'none' : 0};
    position: ${(p) => isIconOnlySidebar(p.sidebar) ? 'absolute' : 'static'};
    left: ${(p) => isIconOnlySidebar(p.sidebar) ? 'calc(50% - 18px)' : 'auto'};
    top: ${(p) => isIconOnlySidebar(p.sidebar) ? '50%' : 'auto'};
    transform: ${(p) => isIconOnlySidebar(p.sidebar) ? 'translateY(-50%)' : 'none'};
    visibility: ${(p) => p.visible ? 'visible' : 'hidden'};
    align-self: center;
    width: 6px;
    min-width: 6px;
	height: 6px;
    margin-right: 3px;
	border-radius: 50%;
	background-color: var(--chrome-accent);
    z-index: 10;
    /* filter: ${(p) => p.selected ? 'none' : 'grayscale(100%)'}; */
`;
const NotificationNumber = styled_components_1.default.span `
    flex: 0;
    position: absolute;
    visibility: ${(p) => p.visible ? 'visible' : 'hidden'};
    align-self: center;
    text-align: center;
    width: 6px;
    min-width: 8px;
	color: #FFF;
	background: var(--chrome-tab-badge-bg);
    border-radius: 50% 50%;
    font-size: 8px;
    padding: 1px;
    left: ${(p) => isIconOnlySidebar(p.sidebar) ? 'calc(50% + 5px)' : '4px'};
    top: ${(p) => isIconOnlySidebar(p.sidebar) ? '-3px' : '0px'};
    z-index: 10;
`;
const ImgTabIcon = styled_components_1.default.img `
    flex: 0;
    height: 18px;
    align-self: center;
    vertical-align: middle;
    filter: ${(p) => p.selected ? 'none' : 'grayscale(80%)'};
`;
const DefaultTabIcon = styled_components_1.default.div `
    flex: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    align-self: center;
    width: 18px;
    height: 18px;
    color: var(--chrome-top-tab-icon);
    opacity: ${(p) => p.selected ? 1 : 0.72};
    font-size: 18px;
`;
const SpecialIcon = styled_components_1.default.img `
    position: absolute;
    display: ${(p) => p.src ? 'block' : 'none'};
    box-sizing: content-box;
    height: 14px;
    width: 14px;
    left: ${(p) => isIconOnlySidebar(p.sidebar) ? 'calc(50% - 2px)' : '16px'};
    top: ${(p) => isIconOnlySidebar(p.sidebar) ? '7px' : '7px'};
    filter: ${(p) => p.selected ? 'none' : 'grayscale(80%)'};
    background-color: #fff;
    border-radius: 4px;
`;
const AudibleIcon = styled_components_1.default.div `
    position: absolute;
    top: ${(p) => isIconOnlySidebar(p.sidebar) ? '50%' : '3px'};
    left: ${(p) => isIconOnlySidebar(p.sidebar) ? 'calc(50% - 27px)' : '-4px'};
    transform: ${(p) => isIconOnlySidebar(p.sidebar) ? 'translateY(-50%)' : 'none'};
    flex: 0;
    width: 16px;
    height: 16px;
    vertical-align: middle;
    color: var(--chrome-tab-text);
`;
const TabName = styled_components_1.default.span `
    flex: 1;
    margin-left: 4px;
    display: ${(p) => isIconOnlySidebar(p.sidebar) ? 'none' : 'block'};
    vertical-align: middle;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    line-height: 1.2;
    font-size: ${(p) => p.sidebar.width < 130 ? `${Math.max(p.sidebar.width / 10 + 1, 7)}px` : '14px'};
`;
const MoreButton = styled_components_1.default.div `
    flex: 0;
    position: ${(p) => isIconOnlySidebar(p.sidebar) ? 'absolute' : 'static'};
    right: ${(p) => isIconOnlySidebar(p.sidebar) ? '-2px' : 'auto'};
    top: ${(p) => isIconOnlySidebar(p.sidebar) ? '50%' : 'auto'};
    transform: ${(p) => isIconOnlySidebar(p.sidebar) ? 'translateY(-50%)' : 'none'};
    align-items: center;
    align-self: center;
    justify-content: center;
    margin-right: ${(p) => isIconOnlySidebar(p.sidebar) ? '0px' : '10px'};
    vertical-align: middle;
    color: var(--chrome-top-tab-icon);
    display: ${(p) => p.selected && !isIconOnlySidebar(p.sidebar) ? 'flex' : 'none'};
    & > svg {
        display: block;
    }
`;
var Mode;
(function (Mode) {
    Mode[Mode["Normal"] = 0] = "Normal";
    Mode[Mode["Editing"] = 1] = "Editing";
})(Mode || (Mode = {}));
const defaultState = {
    faviconLoadFailed: false,
    faviconUrl: '',
    mode: Mode.Normal,
};
const middle = {
    verticalAlign: 'middle',
};
class TabRow extends react_1.default.Component {
    constructor(props) {
        super(props);
        this.getFaviconOrAppIcon = (app) => {
            const { faviconUrl } = this.state;
            if (faviconUrl) {
                return faviconUrl;
            }
            if (app) {
                return app.faviconUrl;
            }
            else {
                return '';
            }
        };
        this.getMainIcon = (tab, app) => {
            switch (tab.iconType) {
                case undefined:
                case 'default':
                case 'default+fromApp':
                    return this.getFaviconOrAppIcon(app);
                case 'fromApp':
                case 'fromApp+default':
                case 'fromApp':
                    return tab.iconFromApp ? tab.iconFromApp : this.getFaviconOrAppIcon(app);
                case 'custom':
                    return tab.iconCustom ? tab.iconCustom : this.getFaviconOrAppIcon(app);
                default:
                    return '';
            }
        };
        this.getSubIcon = (tab, app) => {
            switch (tab.iconType) {
                case 'fromApp+default':
                    return this.getFaviconOrAppIcon(app);
                case 'default+fromApp':
                    return tab.iconFromApp ? tab.iconFromApp : this.getFaviconOrAppIcon(app);
                default:
                    return undefined;
            }
        };
        this.showMoreMenu = () => {
            const { tab } = this.props;
            const { Menu, MenuItem } = remote;
            const menu = new Menu();
            const editItem = new MenuItem({
                click: this.showEditTabDialog,
                label: msg.editApp,
            });
            menu.append(editItem);
            const deleteItem = new MenuItem({
                click: this.deleteTab,
                label: msg.deleteApp,
            });
            menu.append(deleteItem);
            if (this.props.sectionMenuItems && this.props.sectionMenuItems.length > 0) {
                menu.append(new MenuItem({
                    label: "移动到折叠小组",
                    submenu: this.props.sectionMenuItems,
                }));
            }
            menu.append(new MenuItem({ type: 'separator' }));
            // notification menu
            const app = IApp_1.appList.findAppByAppId(tab.appId);
            if (app !== undefined) {
                const submenus = [];
                if (app.getNotificaionType() !== IApp_1.NotificationType.NOT_SUPPORTED) {
                    const notificationItem = {
                        click: this.toggleNotification,
                        label: tab.notification ? msg.notificationsTurnOff : msg.notificationsTurnOn,
                    };
                    submenus.push(notificationItem);
                    const specialNotificationLabelMap = {
                        slack: i18n_1.default.get().appResources.slack.specialNotification,
                        twitter: i18n_1.default.get().appResources.twitter.specialNotification,
                    };
                    const specialNotificationLabel = specialNotificationLabelMap[app.id];
                    if (specialNotificationLabel) {
                        submenus.push({ type: 'separator' });
                        submenus.push({
                            enabled: false,
                            label: app.name,
                        });
                        const specialNotification = tab.settings.specialNotification ? true : false;
                        const specialItem = {
                            checked: specialNotification,
                            click: () => {
                                tab.settings.specialNotification = !specialNotification;
                                Store_1.default.dispatch((0, GroupActionCreators_1.createUpdateTabAction)(tab, Store_1.default));
                                Notifications_1.notifications.updateAppBadge();
                            },
                            enabled: tab.notification,
                            label: '  ' + specialNotificationLabel,
                            type: 'checkbox',
                        };
                        submenus.push(specialItem);
                    }
                }
                else {
                    const notificationItem = {
                        click: this.toggleNotification,
                        enabled: false,
                        label: msg.notificationsNotSupported,
                    };
                    submenus.push(notificationItem);
                }
                const notificaitonItem = new MenuItem({
                    label: msg.notifications,
                    submenu: submenus,
                });
                menu.append(notificaitonItem);
            }
            const iconItem = new MenuItem({
                label: msg.icon.icon,
                submenu: [
                    {
                        checked: tab.iconType === undefined || tab.iconType === 'default',
                        click: () => {
                            this.changeIconType('default');
                        },
                        label: msg.icon.defaultIcon,
                        type: 'radio',
                    },
                    ...(app && app.getIconType() === IApp_1.IconType.SPECIAL ? [
                        {
                            checked: tab.iconType === 'default+fromApp',
                            click: () => {
                                this.changeIconType('default+fromApp');
                            },
                            label: msg.icon.defaultPlusFromApp,
                            type: 'radio',
                        },
                        {
                            checked: tab.iconType === 'fromApp',
                            click: () => {
                                this.changeIconType('fromApp');
                            },
                            label: msg.icon.fromApp,
                            type: 'radio',
                        },
                        {
                            checked: tab.iconType === 'fromApp+default',
                            click: () => {
                                this.changeIconType('fromApp+default');
                            },
                            label: msg.icon.fromAppPlusDefault,
                            type: 'radio',
                        },
                    ] : []),
                    {
                        checked: tab.iconType === 'custom',
                        click: () => {
                            this.chooseCustomIcon();
                        },
                        label: msg.icon.custom,
                        type: 'radio',
                    },
                ],
            });
            menu.append(iconItem);
            const muteItem = new MenuItem({
                click: this.toggleMuted,
                label: tab.muted ? msg.unmute : msg.mute,
            });
            menu.append(muteItem);
            menu.append(new MenuItem({ type: 'separator' }));
            (0, ContextMenu_1.buildMenusForUrl)(tab.url, 'afterLastTab', undefined, tab).forEach((item) => {
                menu.append(new MenuItem(item));
            });
            menu.popup({});
        };
        this.chooseCustomIcon = () => {
            const { tab } = this.props;
            const win = remote.BrowserWindow.getFocusedWindow();
            if (!win) {
                return;
            }
            const opts = {
                filters: [
                    {
                        extensions: ['png', 'jpg', 'jpeg', 'gif'],
                        name: 'Images',
                    },
                ],
                properties: ['openFile'],
            };
            remote.dialog.showOpenDialog(win, opts)
                .then((returnValue) => {
                // if (returnValue.canceled) { return; }
                if (!returnValue.filePaths
                    || returnValue.filePaths.length !== 1) {
                    return;
                }
                const filePath = returnValue.filePaths[0];
                (0, ImageUtils_1.resizeAsDataURL)(`file://${filePath}`, 50, 50)
                    .then((dataUrl) => {
                    tab.iconCustom = dataUrl;
                    tab.iconType = 'custom';
                    Store_1.default.dispatch((0, GroupActionCreators_1.createUpdateTabAction)(tab, Store_1.default));
                });
            });
        };
        this.changeIconType = (iconType) => {
            const { tab } = this.props;
            if (iconType !== 'custom') {
                tab.iconCustom = undefined;
            }
            tab.iconType = iconType;
            Store_1.default.dispatch((0, GroupActionCreators_1.createUpdateTabAction)(tab, Store_1.default));
        };
        this.deleteTab = () => {
            const ok = confirm(msg.deleteAppConfirmMessage);
            if (ok) {
                Store_1.default.dispatch((0, GroupActionCreators_1.createDeleteTabAction)(this.props.tab.id, Store_1.default));
            }
        };
        this.toggleNotification = () => {
            const { tab } = this.props;
            if (tab.notification) {
                tab.notification = false;
                Store_1.default.dispatch((0, GroupActionCreators_1.createUpdateTabAction)(tab, Store_1.default));
                Notifications_1.notifications.updateAppBadge();
            }
            else {
                tab.notification = true;
                Store_1.default.dispatch((0, GroupActionCreators_1.createUpdateTabAction)(tab, Store_1.default));
                // Webviewを生成し、通知の監視対象にするために強制選択
                Store_1.default.dispatch((0, GroupActionCreators_1.createSelectTabAction)(tab.id, Store_1.default));
                Notifications_1.notifications.updateAppBadge();
            }
        };
        this.toggleMuted = () => {
            const { tab } = this.props;
            if (tab.muted) {
                tab.muted = false;
                Store_1.default.dispatch((0, GroupActionCreators_1.createUpdateTabAction)(tab, Store_1.default));
            }
            else {
                tab.muted = true;
                Store_1.default.dispatch((0, GroupActionCreators_1.createUpdateTabAction)(tab, Store_1.default));
            }
        };
        this.openLinkInNewWindow = () => {
            const { id, url } = this.props.tab;
            const tabWithGroup = (0, ITabGroup_1.findTabWithTabGroupByTabId)(Store_1.default.getState().groupList.tabGroups, id);
            if (!tabWithGroup) {
                return;
            }
            const persistId = (0, ITabGroup_1.getPersistId)(tabWithGroup.tabGroup, tabWithGroup.tab);
            electron_1.ipcRenderer.send('open-new-window', persistId, url);
        };
        this.onClickSelect = (e) => {
            Store_1.default.dispatch((0, GroupActionCreators_1.createSelectTabAction)(this.props.tab.id, Store_1.default));
            e.stopPropagation();
        };
        this.onClickMore = (e) => {
            this.showMoreMenu();
            e.stopPropagation();
        };
        this.onContextMenu = (e) => {
            this.showMoreMenu();
            // need preventDefault for Windows
            e.preventDefault();
        };
        this.showEditTabDialog = () => {
            this.setState({
                mode: Mode.Editing,
            });
        };
        this.hideEditTabDialog = () => {
            this.setState({
                mode: Mode.Normal,
            });
        };
        this.onClose = () => {
            this.hideEditTabDialog();
        };
        this.onErrorImgTabIcon = (e) => {
            const currentSrc = e.currentTarget.getAttribute('src');
            if (!navigator.onLine || !currentSrc || (0, Urls_1.isGoogleFaviconUrl)(currentSrc)) {
                this.setState({ faviconLoadFailed: true });
                return;
            }
            const { tab } = this.props;
            const app = IApp_1.appList.findAppByAppId(tab.appId);
            const currentUrl = this.getFaviconOrAppIcon(app);
            const fallbackUrl = (0, Urls_1.getGoogleFaviconUrlOrEmpty)(currentUrl);
            if (!fallbackUrl) {
                this.setState({ faviconLoadFailed: true });
                return;
            }
            this.setState({
                faviconLoadFailed: false,
                faviconUrl: fallbackUrl,
            });
        };
        this.state = defaultState;
    }
    componentWillReceiveProps(nextProps, nextContext) {
        const { faviconUrl } = nextProps.tab;
        this.setState({
            faviconLoadFailed: faviconUrl !== this.props.tab.faviconUrl ? false : this.state.faviconLoadFailed,
            faviconUrl,
        });
    }
    componentDidUpdate(prevProps, prevState) {
        if (prevState.mode === Mode.Normal && this.state.mode === Mode.Editing) {
            if (this.textInput) {
                this.textInput.focus();
                this.textInput.select();
            }
        }
    }
    render() {
        const { tab, selectedTabId, index, sidebar, notificationsSetting } = this.props;
        const selected = tab.id === selectedTabId;
        const app = IApp_1.appList.findAppByAppId(tab.appId);
        const mainIcon = this.getMainIcon(tab, app);
        const subIcon = this.getSubIcon(tab, app);
        const tabIcon = mainIcon && !this.state.faviconLoadFailed
            ? react_1.default.createElement(ImgTabIcon, { selected: selected, src: mainIcon, onError: this.onErrorImgTabIcon })
            : react_1.default.createElement(DefaultTabIcon, { selected: selected },
                react_1.default.createElement(lucide_react_1.Globe, { size: 18 }));
        const visibleNotificationMark = (!notificationsSetting.muted
            && tab.notification
            && tab.notificationCount !== 0);
        const audibleIcon = this.props.audible ?
            (react_1.default.createElement(AudibleIcon, { sidebar: sidebar },
                tab.muted ? react_1.default.createElement(lucide_react_1.VolumeX, { size: 16 }) : react_1.default.createElement(lucide_react_1.Volume2, { size: 16 }),
                " ")) : null;
        const count = tab.notificationCount >= 100 ? 99 : tab.notificationCount;
        return (react_1.default.createElement(react_beautiful_dnd_1.Draggable, { type: "TAB", key: tab.id, draggableId: tab.id, index: index, isDragDisabled: this.props.dragDisabled === true, "data-react-beautiful-dnd-drag-handle": "none" }, (provided, snapshot) => (react_1.default.createElement(Container, { className: "tab_container", selected: selected, sidebar: sidebar, onClick: this.onClickSelect, onContextMenu: this.onContextMenu, ref: provided.innerRef, ...provided.draggableProps, "data-tip": tab.name },
            react_1.default.createElement(TabBody, { sidebar: sidebar, ...provided.dragHandleProps, "data-react-beautiful-dnd-drag-handle": "pointer" },
                react_1.default.createElement(NotificationMark, { selected: selected, sidebar: sidebar, visible: visibleNotificationMark && !notificationsSetting.asNumber }),
                notificationsSetting.asNumber ?
                    react_1.default.createElement(NotificationNumber, { selected: selected, sidebar: sidebar, visible: visibleNotificationMark, count: tab.notificationCount }, count)
                    : null,
                audibleIcon,
                tabIcon,
                react_1.default.createElement(SpecialIcon, { selected: selected, sidebar: sidebar, src: subIcon }),
                react_1.default.createElement(TabName, { sidebar: sidebar }, tab.name),
                react_1.default.createElement(MoreButton, { selected: selected, sidebar: sidebar, onClick: this.onClickMore },
                    react_1.default.createElement(lucide_react_1.MoreVertical, { size: 16, style: middle }))),
            this.state.mode === Mode.Editing ?
                react_1.default.createElement(EditTabDialog_1.EditTabDialog, { onClose: this.onClose, tab: tab })
                : null))));
    }
}
exports.default = TabRow;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVGFiUm93LmpzIiwic291cmNlUm9vdCI6Ii4vdHN4LyIsInNvdXJjZXMiOlsicmVuZGVyZXIvY29tcG9uZW50cy9UYWJSb3cudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSx5REFBMkM7QUFDM0MsdUNBRWtCO0FBQ2xCLCtDQUFxRTtBQUNyRSxrREFBMEI7QUFDMUIsNkRBQTJGO0FBQzNGLDBFQUF1QztBQUN2Qyx3RUFFd0M7QUFDeEMsMENBQTRFO0FBQzVFLDREQUF5RDtBQUN6RCxtREFBK0I7QUFFL0IsaURBQW9FO0FBRXBFLG1EQUErRTtBQUMvRSxxREFBNkI7QUFDN0Isc0RBQXdEO0FBQ3hELG9EQUFzRDtBQUN0RCx3Q0FBK0U7QUFDL0UsbURBQWdEO0FBR2hELE1BQU0sR0FBRyxHQUFHLGNBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUM7QUFDL0IsTUFBTSxpQkFBaUIsR0FBRyxDQUFDLE9BQWlCLEVBQVcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEdBQUcsK0JBQW9CLENBQUM7QUFFL0YsZ0JBQWdCO0FBRWhCLE1BQU0sU0FBUyxHQUFHLDJCQUFNLENBQUMsRUFBRSxDQUEwQzs7Y0FFdkQsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLElBQUksaUJBQWlCLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUc7ZUFDakUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLGlCQUFpQjthQUM3RSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsaUNBQWlDLENBQUMsQ0FBQyxDQUFDLHdCQUF3Qjt3QkFDckUsQ0FBQyxDQUFD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QUFJLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ2hDLDhCQUFDLDZCQUFhLElBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFLEdBQUcsR0FBSTtnQkFDbEQsQ0FBQyxDQUFDLElBQUksQ0FFRixDQUNmLENBQ08sQ0FDZixDQUFDO0lBQ04sQ0FBQztDQW9USjtBQUVELGtCQUFlLE1BQU0sQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHJlbW90ZSBmcm9tICdAZWxlY3Ryb24vcmVtb3RlJztcbmltcG9ydCB7XG4gICAgaXBjUmVuZGVyZXIsIE1lbnVJdGVtQ29uc3RydWN0b3JPcHRpb25zLCBPcGVuRGlhbG9nU3luY09wdGlvbnNcbn0gZnJvbSAnZWxlY3Ryb24nO1xuaW1wb3J0IHsgR2xvYmUsIE1vcmVWZXJ0aWNhbCwgVm9sdW1lMiwgVm9sdW1lWCB9IGZyb20gJ2x1Y2lkZS1yZWFjdCc7XG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgRHJhZ2dhYmxlLCBEcmFnZ2FibGVQcm92aWRlZCwgRHJhZ2dhYmxlU3RhdGVTbmFwc2hvdCB9IGZyb20gJ3JlYWN0LWJlYXV0aWZ1bC1kbmQnO1xuaW1wb3J0IFN0eWxlZCBmcm9tICdzdHlsZWQtY29tcG9uZW50cyc7XG5pbXBvcnQge1xuICAgIGNyZWF0ZURlbGV0ZVRhYkFjdGlvbiwgY3JlYXRlU2VsZWN0VGFiQWN0aW9uLCBjcmVhdGVVcGRhdGVUYWJBY3Rpb25cbn0gZnJvbSAnLi4vYWN0aW9ucy9Hcm91cEFjdGlvbkNyZWF0b3JzJztcbmltcG9ydCB7IGFwcExpc3QsIElBcHAsIEljb25UeXBlLCBOb3RpZmljYXRpb25UeXBlIH0gZnJvbSAnLi4vZG9tYWlucy9JQXBwJztcbmltcG9ydCB7IG5vdGlmaWNhdGlvbnMgfSBmcm9tICcuLi9kb21haW5zL05vdGlmaWNhdGlvbnMnO1xuaW1wb3J0IE1lc3NhZ2VzIGZyb20gJy4uL2kxOG4nO1xuaW1wb3J0IHsgSU5vdGlmaWNhdGlvbnNTZXR0aW5nIH0gZnJvbSAnLi4vc3RhdGVzL0lTZXR0aW5ncyc7XG5pbXBvcnQgeyBJU2lkZWJhciwgc2lkZWJhckljb25Pbmx5V2lkdGggfSBmcm9tICcuLi9zdGF0ZXMvSVNpZGViYXInO1xuaW1wb3J0IHsgSVRhYiwgVGFiSWNvblR5cGUgfSBmcm9tICcuLi9zdGF0ZXMvSVRhYic7XG5pbXBvcnQgeyBmaW5kVGFiV2l0aFRhYkdyb3VwQnlUYWJJZCwgZ2V0UGVyc2lzdElkIH0gZnJvbSAnLi4vc3RhdGVzL0lUYWJHcm91cCc7XG5pbXBvcnQgc3RvcmUgZnJvbSAnLi4vU3RvcmUnO1xuaW1wb3J0IHsgYnVpbGRNZW51c0ZvclVybCB9IGZyb20gJy4uL3V0aWxzL0NvbnRleHRNZW51JztcbmltcG9ydCB7IHJlc2l6ZUFzRGF0YVVSTCB9IGZyb20gJy4uL3V0aWxzL0ltYWdlVXRpbHMnO1xuaW1wb3J0IHsgZ2V0R29vZ2xlRmF2aWNvblVybE9yRW1wdHksIGlzR29vZ2xlRmF2aWNvblVybCB9IGZyb20gJy4uL3V0aWxzL1VybHMnO1xuaW1wb3J0IHsgRWRpdFRhYkRpYWxvZyB9IGZyb20gJy4vRWRpdFRhYkRpYWxvZyc7XG5cblxuY29uc3QgbXNnID0gTWVzc2FnZXMuZ2V0KCkuYXBwO1xuY29uc3QgaXNJY29uT25seVNpZGViYXIgPSAoc2lkZWJhcjogSVNpZGViYXIpOiBib29sZWFuID0+IHNpZGViYXIud2lkdGggPCBzaWRlYmFySWNvbk9ubHlXaWR0aDtcblxuLy8jcmVnaW9uIHN0eWxlZFxuXG5jb25zdCBDb250YWluZXIgPSBTdHlsZWQubGk8eyBzZWxlY3RlZDogYm9vbGVhbiwgc2lkZWJhcjogSVNpZGViYXIgfT5gXG4gICAgYm94LXNpemluZzogYm9yZGVyLWJveDtcbiAgICBtYXJnaW46ICR7KHApID0+IHAuc2VsZWN0ZWQgJiYgaXNJY29uT25seVNpZGViYXIocC5zaWRlYmFyKSA/ICcwIC0xcHgnIDogJzAnfTtcbiAgICBwYWRkaW5nOiAkeyhwKSA9PiBpc0ljb25Pbmx5U2lkZWJhcihwLnNpZGViYXIpID8gJzdweCAwcHggOHB4IDBweCcgOiAnN3B4IDBweCA4cHggNnB4J307XG4gICAgY29sb3I6ICR7KHApID0+IHAuc2VsZWN0ZWQgPyAndmFyKC0tY2hyb21lLXRhYi10ZXh0LXNlbGVjdGVkKScgOiAndmFyKC0tY2hyb21lLXRhYi10ZXh0KSd9O1xuICAgIGJhY2tncm91bmQtY29sb3I6ICR7KHApID0+IHAuc2VsZWN0ZWQgPyAndmFyKC0tY2hyb21lLXRhYi1zZWxlY3RlZC1iZyknIDogJ3RyYW5zcGFyZW50J307XG4gICAgYmFja2dyb3VuZC1jb2xvcjogJHsocCkgPT4gcC5zZWxlY3RlZCA/ICdjb2xvci1taXgoaW4gc3JnYiwgdmFyKC0tY2hyb21lLXRhYi1zZWxlY3RlZC1iZykgODIlLCB0cmFuc3BhcmVudCknIDogJ3RyYW5zcGFyZW50J307XG4gICAgZm9udC13ZWlnaHQ6ICR7KHApID0+IHAuc2VsZWN0ZWQgPyAnYm9sZCcgOiAnJ307XG4gICAgYm9yZGVyLXJhZGl1czogMTVweDtcbiAgICBtaW4td2lkdGg6IDE4cHg7XG4gICAgY3Vyc29yOiBwb2ludGVyO1xuICAgIHRyYW5zaXRpb246IGJhY2tncm91bmQtY29sb3IgMC4xMnMgZWFzZSwgY29sb3IgMC4xMnMgZWFzZTtcbmA7XG5cbmNvbnN0IFRhYkJvZHkgPSBTdHlsZWQuZGl2PHtzaWRlYmFyOiBJU2lkZWJhcn0+YFxuICAgIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAganVzdGlmeS1jb250ZW50OiAkeyhwKSA9PiBpc0ljb25Pbmx5U2lkZWJhcihwLnNpZGViYXIpID8gJ2NlbnRlcicgOiAnZmxleC1zdGFydCd9O1xuICAgIG91dGxpbmU6IG5vbmU7XG5gO1xuXG5jb25zdCBOb3RpZmljYXRpb25NYXJrID0gU3R5bGVkLnNwYW48eyBzZWxlY3RlZDogYm9vbGVhbiwgc2lkZWJhcjogSVNpZGViYXIsIHZpc2libGU6IGJvb2xlYW4gfT5gXG4gICAgZmxleDogJHsocCkgPT4gaXNJY29uT25seVNpZGViYXIocC5zaWRlYmFyKSA/ICdub25lJyA6IDB9O1xuICAgIHBvc2l0aW9uOiAkeyhwKSA9PiBpc0ljb25Pbmx5U2lkZWJhcihwLnNpZGViYXIpID8gJ2Fic29sdXRlJyA6ICdzdGF0aWMnfTtcbiAgICBsZWZ0OiAkeyhwKSA9PiBpc0ljb25Pbmx5U2lkZWJhcihwLnNpZGViYXIpID8gJ2NhbGMoNTAlIC0gMThweCknIDogJ2F1dG8nfTtcbiAgICB0b3A6ICR7KHApID0+IGlzSWNvbk9ubHlTaWRlYmFyKHAuc2lkZWJhcikgPyAnNTAlJyA6ICdhdXRvJ307XG4gICAgdHJhbnNmb3JtOiAkeyhwKSA9PiBpc0ljb25Pbmx5U2lkZWJhcihwLnNpZGViYXIpID8gJ3RyYW5zbGF0ZVkoLTUwJSknIDogJ25vbmUnfTtcbiAgICB2aXNpYmlsaXR5OiAkeyhwKSA9PiBwLnZpc2libGUgPyAndmlzaWJsZScgOiAnaGlkZGVuJ307XG4gICAgYWxpZ24tc2VsZjogY2VudGVyO1xuICAgIHdpZHRoOiA2cHg7XG4gICAgbWluLXdpZHRoOiA2cHg7XG5cdGhlaWdodDogNnB4O1xuICAgIG1hcmdpbi1yaWdodDogM3B4O1xuXHRib3JkZXItcmFkaXVzOiA1MCU7XG5cdGJhY2tncm91bmQtY29sb3I6IHZhcigtLWNocm9tZS1hY2NlbnQpO1xuICAgIHotaW5kZXg6IDEwO1xuICAgIC8qIGZpbHRlcjogJHsocCkgPT4gcC5zZWxlY3RlZCA/ICdub25lJyA6ICdncmF5c2NhbGUoMTAwJSknfTsgKi9cbmA7XG5cbmNvbnN0IE5vdGlmaWNhdGlvbk51bWJlciA9IFN0eWxlZC5zcGFuPHsgc2VsZWN0ZWQ6IGJvb2xlYW4sIHNpZGViYXI6IElTaWRlYmFyLCB2aXNpYmxlOiBib29sZWFuLCBjb3VudDogbnVtYmVyIH0+YFxuICAgIGZsZXg6IDA7XG4gICAgcG9zaXRpb246IGFic29sdXRlO1xuICAgIHZpc2liaWxpdHk6ICR7KHApID0+IHAudmlzaWJsZSA/ICd2aXNpYmxlJyA6ICdoaWRkZW4nfTtcbiAgICBhbGlnbi1zZWxmOiBjZW50ZXI7XG4gICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICAgIHdpZHRoOiA2cHg7XG4gICAgbWluLXdpZHRoOiA4cHg7XG5cdGNvbG9yOiAjRkZGO1xuXHRiYWNrZ3JvdW5kOiB2YXIoLS1jaHJvbWUtdGFiLWJhZGdlLWJnKTtcbiAgICBib3JkZXItcmFkaXVzOiA1MCUgNTAlO1xuICAgIGZvbnQtc2l6ZTogOHB4O1xuICAgIHBhZGRpbmc6IDFweDtcbiAgICBsZWZ0OiAkeyhwKSA9PiBpc0ljb25Pbmx5U2lkZWJhcihwLnNpZGViYXIpID8gJ2NhbGMoNTAlICsgNXB4KScgOiAnNHB4J307XG4gICAgdG9wOiAkeyhwKSA9PiBpc0ljb25Pbmx5U2lkZWJhcihwLnNpZGViYXIpID8gJy0zcHgnIDogJzBweCd9O1xuICAgIHotaW5kZXg6IDEwO1xuYDtcblxuY29uc3QgSW1nVGFiSWNvbiA9IFN0eWxlZC5pbWc8eyBzZWxlY3RlZDogYm9vbGVhbiB9PmBcbiAgICBmbGV4OiAwO1xuICAgIGhlaWdodDogMThweDtcbiAgICBhbGlnbi1zZWxmOiBjZW50ZXI7XG4gICAgdmVydGljYWwtYWxpZ246IG1pZGRsZTtcbiAgICBmaWx0ZXI6ICR7KHApID0+IHAuc2VsZWN0ZWQgPyAnbm9uZScgOiAnZ3JheXNjYWxlKDgwJSknfTtcbmA7XG5cbmNvbnN0IERlZmF1bHRUYWJJY29uID0gU3R5bGVkLmRpdjx7IHNlbGVjdGVkOiBib29sZWFuIH0+YFxuICAgIGZsZXg6IDA7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgIGFsaWduLXNlbGY6IGNlbnRlcjtcbiAgICB3aWR0aDogMThweDtcbiAgICBoZWlnaHQ6IDE4cHg7XG4gICAgY29sb3I6IHZhcigtLWNocm9tZS10b3AtdGFiLWljb24pO1xuICAgIG9wYWNpdHk6ICR7KHApID0+IHAuc2VsZWN0ZWQgPyAxIDogMC43Mn07XG4gICAgZm9udC1zaXplOiAxOHB4O1xuYDtcblxuY29uc3QgU3BlY2lhbEljb24gPSBTdHlsZWQuaW1nPHsgc2VsZWN0ZWQ6IGJvb2xlYW4sIHNpZGViYXI6IElTaWRlYmFyLCBzcmM6IHN0cmluZyB8IHVuZGVmaW5lZCB9PmBcbiAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgZGlzcGxheTogJHsocCkgPT4gcC5zcmMgPyAnYmxvY2snIDogJ25vbmUnfTtcbiAgICBib3gtc2l6aW5nOiBjb250ZW50LWJveDtcbiAgICBoZWlnaHQ6IDE0cHg7XG4gICAgd2lkdGg6IDE0cHg7XG4gICAgbGVmdDogJHsocCkgPT4gaXNJY29uT25seVNpZGViYXIocC5zaWRlYmFyKSA/ICdjYWxjKDUwJSAtIDJweCknIDogJzE2cHgnfTtcbiAgICB0b3A6ICR7KHApID0+IGlzSWNvbk9ubHlTaWRlYmFyKHAuc2lkZWJhcikgPyAnN3B4JyA6ICc3cHgnfTtcbiAgICBmaWx0ZXI6ICR7KHApID0+IHAuc2VsZWN0ZWQgPyAnbm9uZScgOiAnZ3JheXNjYWxlKDgwJSknfTtcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZmZmO1xuICAgIGJvcmRlci1yYWRpdXM6IDRweDtcbmA7XG5cbmNvbnN0IEF1ZGlibGVJY29uID0gU3R5bGVkLmRpdjx7IHNpZGViYXI6IElTaWRlYmFyIH0+YFxuICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICB0b3A6ICR7KHApID0+IGlzSWNvbk9ubHlTaWRlYmFyKHAuc2lkZWJhcikgPyAnNTAlJyA6ICczcHgnfTtcbiAgICBsZWZ0OiAkeyhwKSA9PiBpc0ljb25Pbmx5U2lkZWJhcihwLnNpZGViYXIpID8gJ2NhbGMoNTAlIC0gMjdweCknIDogJy00cHgnfTtcbiAgICB0cmFuc2Zvcm06ICR7KHApID0+IGlzSWNvbk9ubHlTaWRlYmFyKHAuc2lkZWJhcikgPyAndHJhbnNsYXRlWSgtNTAlKScgOiAnbm9uZSd9O1xuICAgIGZsZXg6IDA7XG4gICAgd2lkdGg6IDE2cHg7XG4gICAgaGVpZ2h0OiAxNnB4O1xuICAgIHZlcnRpY2FsLWFsaWduOiBtaWRkbGU7XG4gICAgY29sb3I6IHZhcigtLWNocm9tZS10YWItdGV4dCk7XG5gO1xuXG5jb25zdCBUYWJOYW1lID0gU3R5bGVkLnNwYW48e3NpZGViYXI6IElTaWRlYmFyfT5gXG4gICAgZmxleDogMTtcbiAgICBtYXJnaW4tbGVmdDogNHB4O1xuICAgIGRpc3BsYXk6ICR7KHApID0+IGlzSWNvbk9ubHlTaWRlYmFyKHAuc2lkZWJhcikgPyAnbm9uZScgOiAnYmxvY2snfTtcbiAgICB2ZXJ0aWNhbC1hbGlnbjogbWlkZGxlO1xuICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbiAgICB0ZXh0LW92ZXJmbG93OiBlbGxpcHNpcztcbiAgICBsaW5lLWhlaWdodDogMS4yO1xuICAgIGZvbnQtc2l6ZTogJHsocCkgPT4gcC5zaWRlYmFyLndpZHRoIDwgMTMwID8gYCR7TWF0aC5tYXgocC5zaWRlYmFyLndpZHRoIC8gMTAgKyAxLCA3KX1weGAgOiAnMTRweCd9O1xuYDtcblxuY29uc3QgTW9yZUJ1dHRvbiA9IFN0eWxlZC5kaXY8e3NlbGVjdGVkOiBib29sZWFuLCBzaWRlYmFyOiBJU2lkZWJhcn0+YFxuICAgIGZsZXg6IDA7XG4gICAgcG9zaXRpb246ICR7KHApID0+IGlzSWNvbk9ubHlTaWRlYmFyKHAuc2lkZWJhcikgPyAnYWJzb2x1dGUnIDogJ3N0YXRpYyd9O1xuICAgIHJpZ2h0OiAkeyhwKSA9PiBpc0ljb25Pbmx5U2lkZWJhcihwLnNpZGViYXIpID8gJy0ycHgnIDogJ2F1dG8nfTtcbiAgICB0b3A6ICR7KHApID0+IGlzSWNvbk9ubHlTaWRlYmFyKHAuc2lkZWJhcikgPyAnNTAlJyA6ICdhdXRvJ307XG4gICAgdHJhbnNmb3JtOiAkeyhwKSA9PiBpc0ljb25Pbmx5U2lkZWJhcihwLnNpZGViYXIpID8gJ3RyYW5zbGF0ZVkoLTUwJSknIDogJ25vbmUnfTtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGFsaWduLXNlbGY6IGNlbnRlcjtcbiAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICBtYXJnaW4tcmlnaHQ6ICR7KHApID0+IGlzSWNvbk9ubHlTaWRlYmFyKHAuc2lkZWJhcikgPyAnMHB4JyA6ICcxMHB4J307XG4gICAgdmVydGljYWwtYWxpZ246IG1pZGRsZTtcbiAgICBjb2xvcjogdmFyKC0tY2hyb21lLXRvcC10YWItaWNvbik7XG4gICAgZGlzcGxheTogJHsocCkgPT4gcC5zZWxlY3RlZCAmJiAhaXNJY29uT25seVNpZGViYXIocC5zaWRlYmFyKSA/ICdmbGV4JyA6ICdub25lJ307XG4gICAgJiA+IHN2ZyB7XG4gICAgICAgIGRpc3BsYXk6IGJsb2NrO1xuICAgIH1cbmA7XG5cbi8vI2VuZHJlZ2lvblxuXG5pbnRlcmZhY2UgSVByb3BzIHtcbiAgICB0YWI6IElUYWI7XG4gICAgc2VsZWN0ZWRUYWJJZD86IHN0cmluZztcbiAgICBpbmRleDogbnVtYmVyO1xuICAgIHNpZGViYXI6IElTaWRlYmFyO1xuICAgIGF1ZGlibGU6IGJvb2xlYW47XG4gICAgbm90aWZpY2F0aW9uc1NldHRpbmc6IElOb3RpZmljYXRpb25zU2V0dGluZztcbn1cblxuZW51bSBNb2RlIHtcbiAgICBOb3JtYWwsXG4gICAgRWRpdGluZyxcbn1cblxuaW50ZXJmYWNlIElMb2NhbFN0YXRlIHtcbiAgICBmYXZpY29uTG9hZEZhaWxlZDogYm9vbGVhbjtcbiAgICBtb2RlOiBNb2RlO1xuICAgIGZhdmljb25Vcmw6IHN0cmluZyB8IHVuZGVmaW5lZDtcbn1cblxuY29uc3QgZGVmYXVsdFN0YXRlOiBJTG9jYWxTdGF0ZSA9IHtcbiAgICBmYXZpY29uTG9hZEZhaWxlZDogZmFsc2UsXG4gICAgZmF2aWNvblVybDogJycsXG4gICAgbW9kZTogTW9kZS5Ob3JtYWwsXG59O1xuXG5jb25zdCBtaWRkbGUgPSB7XG4gICAgdmVydGljYWxBbGlnbjogJ21pZGRsZScsXG59O1xuXG5jbGFzcyBUYWJSb3cgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQ8SVByb3BzLCBJTG9jYWxTdGF0ZT4ge1xuICAgIHByaXZhdGUgdGV4dElucHV0OiBIVE1MSW5wdXRFbGVtZW50IHwgdW5kZWZpbmVkO1xuXG4gICAgcHVibGljIGNvbnN0cnVjdG9yKHByb3BzOiBJUHJvcHMpIHtcbiAgICAgICAgc3VwZXIocHJvcHMpO1xuICAgICAgICB0aGlzLnN0YXRlID0gZGVmYXVsdFN0YXRlO1xuICAgIH1cblxuICAgIHB1YmxpYyBjb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzKG5leHRQcm9wczogUmVhZG9ubHk8SVByb3BzPiwgbmV4dENvbnRleHQ6IGFueSkge1xuICAgICAgICBjb25zdCB7IGZhdmljb25VcmwgfSA9IG5leHRQcm9wcy50YWI7XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgZmF2aWNvbkxvYWRGYWlsZWQ6IGZhdmljb25VcmwgIT09IHRoaXMucHJvcHMudGFiLmZhdmljb25VcmwgPyBmYWxzZSA6IHRoaXMuc3RhdGUuZmF2aWNvbkxvYWRGYWlsZWQsXG4gICAgICAgICAgICBmYXZpY29uVXJsLFxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgY29tcG9uZW50RGlkVXBkYXRlKHByZXZQcm9wczogUmVhZG9ubHk8SVByb3BzPiwgcHJldlN0YXRlOiBSZWFkb25seTxJTG9jYWxTdGF0ZT4pIHtcbiAgICAgICAgaWYgKHByZXZTdGF0ZS5tb2RlID09PSBNb2RlLk5vcm1hbCAmJiB0aGlzLnN0YXRlLm1vZGUgPT09IE1vZGUuRWRpdGluZykge1xuICAgICAgICAgICAgaWYgKHRoaXMudGV4dElucHV0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy50ZXh0SW5wdXQuZm9jdXMoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnRleHRJbnB1dC5zZWxlY3QoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyByZW5kZXIoKSB7XG4gICAgICAgIGNvbnN0IHt0YWIsIHNlbGVjdGVkVGFiSWQsIGluZGV4LCBzaWRlYmFyLCBub3RpZmljYXRpb25zU2V0dGluZyB9ID0gdGhpcy5wcm9wcztcbiAgICAgICAgY29uc3Qgc2VsZWN0ZWQgPSB0YWIuaWQgPT09IHNlbGVjdGVkVGFiSWQ7XG4gICAgICAgIGNvbnN0IGFwcCA9IGFwcExpc3QuZmluZEFwcEJ5QXBwSWQodGFiLmFwcElkKTtcbiAgICAgICAgY29uc3QgbWFpbkljb24gPSB0aGlzLmdldE1haW5JY29uKHRhYiwgYXBwKTtcbiAgICAgICAgY29uc3Qgc3ViSWNvbiA9IHRoaXMuZ2V0U3ViSWNvbih0YWIsIGFwcCk7XG4gICAgICAgIGNvbnN0IHRhYkljb24gPSBtYWluSWNvbiAmJiAhdGhpcy5zdGF0ZS5mYXZpY29uTG9hZEZhaWxlZFxuICAgICAgICAgICAgPyA8SW1nVGFiSWNvbiBzZWxlY3RlZD17c2VsZWN0ZWR9IHNyYz17bWFpbkljb259IG9uRXJyb3I9e3RoaXMub25FcnJvckltZ1RhYkljb259IC8+XG4gICAgICAgICAgICA6IDxEZWZhdWx0VGFiSWNvbiBzZWxlY3RlZD17c2VsZWN0ZWR9PjxHbG9iZSBzaXplPXsxOH0gLz48L0RlZmF1bHRUYWJJY29uPjtcbiAgICAgICAgY29uc3QgdmlzaWJsZU5vdGlmaWNhdGlvbk1hcmsgPSAoXG4gICAgICAgICAgICAhbm90aWZpY2F0aW9uc1NldHRpbmcubXV0ZWRcbiAgICAgICAgICAgICYmIHRhYi5ub3RpZmljYXRpb25cbiAgICAgICAgICAgICYmIHRhYi5ub3RpZmljYXRpb25Db3VudCAhPT0gMFxuICAgICAgICApO1xuICAgICAgICBjb25zdCBhdWRpYmxlSWNvbiA9IHRoaXMucHJvcHMuYXVkaWJsZSA/XG4gICAgICAgICAgICAoIDxBdWRpYmxlSWNvbiBzaWRlYmFyPXtzaWRlYmFyfT57IHRhYi5tdXRlZCA/IDxWb2x1bWVYIHNpemU9ezE2fSAvPiA6IDxWb2x1bWUyIHNpemU9ezE2fSAvPiB9IDwvQXVkaWJsZUljb24+KSA6IG51bGw7XG4gICAgICAgIGNvbnN0IGNvdW50ID0gdGFiLm5vdGlmaWNhdGlvbkNvdW50ID49IDEwMCA/IDk5IDogdGFiLm5vdGlmaWNhdGlvbkNvdW50O1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPERyYWdnYWJsZVxuICAgICAgICAgICAgICAgIHR5cGU9XCJUQUJcIlxuICAgICAgICAgICAgICAgIGtleT17dGFiLmlkfVxuICAgICAgICAgICAgICAgIGRyYWdnYWJsZUlkPXt0YWIuaWR9XG4gICAgICAgICAgICAgICAgaW5kZXg9e2luZGV4fVxuICAgICAgICAgICAgICAgIGRhdGEtcmVhY3QtYmVhdXRpZnVsLWRuZC1kcmFnLWhhbmRsZT1cIm5vbmVcIlxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIHsocHJvdmlkZWQ6IERyYWdnYWJsZVByb3ZpZGVkLCBzbmFwc2hvdDogRHJhZ2dhYmxlU3RhdGVTbmFwc2hvdCkgPT4gKFxuICAgICAgICAgICAgICAgICAgICA8Q29udGFpbmVyXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ0YWJfY29udGFpbmVyXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGVjdGVkPXtzZWxlY3RlZH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHNpZGViYXI9e3NpZGViYXJ9XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXt0aGlzLm9uQ2xpY2tTZWxlY3R9XG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNvbnRleHRNZW51PXt0aGlzLm9uQ29udGV4dE1lbnV9XG4gICAgICAgICAgICAgICAgICAgICAgICByZWY9e3Byb3ZpZGVkLmlubmVyUmVmfVxuICAgICAgICAgICAgICAgICAgICAgICAgey4uLnByb3ZpZGVkLmRyYWdnYWJsZVByb3BzfVxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS10aXA9e3RhYi5uYW1lfVxuICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICA8VGFiQm9keVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpZGViYXI9e3NpZGViYXJ9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgey4uLnByb3ZpZGVkLmRyYWdIYW5kbGVQcm9wc31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhLXJlYWN0LWJlYXV0aWZ1bC1kbmQtZHJhZy1oYW5kbGU9XCJwb2ludGVyXCJcbiAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8Tm90aWZpY2F0aW9uTWFya1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxlY3RlZD17c2VsZWN0ZWR9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpZGViYXI9e3NpZGViYXJ9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZpc2libGU9e3Zpc2libGVOb3RpZmljYXRpb25NYXJrICYmICFub3RpZmljYXRpb25zU2V0dGluZy5hc051bWJlcn0gLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vdGlmaWNhdGlvbnNTZXR0aW5nLmFzTnVtYmVyID9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPE5vdGlmaWNhdGlvbk51bWJlclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZWN0ZWQ9e3NlbGVjdGVkfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2lkZWJhcj17c2lkZWJhcn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZpc2libGU9e3Zpc2libGVOb3RpZmljYXRpb25NYXJrfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY291bnQ9e3RhYi5ub3RpZmljYXRpb25Db3VudH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2NvdW50fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L05vdGlmaWNhdGlvbk51bWJlcj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBudWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHthdWRpYmxlSWNvbn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7dGFiSWNvbn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8U3BlY2lhbEljb24gc2VsZWN0ZWQ9e3NlbGVjdGVkfSBzaWRlYmFyPXtzaWRlYmFyfSBzcmM9e3N1Ykljb259IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPFRhYk5hbWUgc2lkZWJhcj17c2lkZWJhcn0+e3RhYi5uYW1lfTwvVGFiTmFtZT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8TW9yZUJ1dHRvbiBzZWxlY3RlZD17c2VsZWN0ZWR9IHNpZGViYXI9e3NpZGViYXJ9IG9uQ2xpY2s9e3RoaXMub25DbGlja01vcmV9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8TW9yZVZlcnRpY2FsIHNpemU9ezE2fSBzdHlsZT17bWlkZGxlfSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvTW9yZUJ1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvVGFiQm9keT5cbiAgICAgICAgICAgICAgICAgICAgICAgIHsgdGhpcy5zdGF0ZS5tb2RlID09PSBNb2RlLkVkaXRpbmcgP1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxFZGl0VGFiRGlhbG9nIG9uQ2xvc2U9e3RoaXMub25DbG9zZX0gdGFiPXt0YWJ9IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBudWxsXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIDwvQ29udGFpbmVyPlxuICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8L0RyYWdnYWJsZT5cbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldEZhdmljb25PckFwcEljb24gPSAoYXBwOiBJQXBwIHwgdW5kZWZpbmVkKTogc3RyaW5nID0+IHtcbiAgICAgICAgY29uc3QgeyBmYXZpY29uVXJsIH0gPSB0aGlzLnN0YXRlO1xuICAgICAgICBpZiAoZmF2aWNvblVybCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhdmljb25Vcmw7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGFwcCkge1xuICAgICAgICAgICAgcmV0dXJuIGFwcC5mYXZpY29uVXJsO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRNYWluSWNvbiA9ICh0YWI6IElUYWIsIGFwcDogSUFwcCB8IHVuZGVmaW5lZCk6IHN0cmluZyA9PiB7XG4gICAgICAgIHN3aXRjaCAodGFiLmljb25UeXBlKSB7XG4gICAgICAgICAgICBjYXNlIHVuZGVmaW5lZDpcbiAgICAgICAgICAgIGNhc2UgJ2RlZmF1bHQnOlxuICAgICAgICAgICAgY2FzZSAnZGVmYXVsdCtmcm9tQXBwJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRGYXZpY29uT3JBcHBJY29uKGFwcCk7XG4gICAgICAgICAgICBjYXNlICdmcm9tQXBwJzpcbiAgICAgICAgICAgIGNhc2UgJ2Zyb21BcHArZGVmYXVsdCc6XG4gICAgICAgICAgICBjYXNlICdmcm9tQXBwJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gdGFiLmljb25Gcm9tQXBwID8gdGFiLmljb25Gcm9tQXBwIDogdGhpcy5nZXRGYXZpY29uT3JBcHBJY29uKGFwcCk7XG4gICAgICAgICAgICBjYXNlICdjdXN0b20nOlxuICAgICAgICAgICAgICAgIHJldHVybiB0YWIuaWNvbkN1c3RvbSA/IHRhYi5pY29uQ3VzdG9tIDogdGhpcy5nZXRGYXZpY29uT3JBcHBJY29uKGFwcCk7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0U3ViSWNvbiA9ICh0YWI6IElUYWIsIGFwcDogSUFwcCB8IHVuZGVmaW5lZCk6IHN0cmluZyB8IHVuZGVmaW5lZCA9PiB7XG4gICAgICAgIHN3aXRjaCAodGFiLmljb25UeXBlKSB7XG4gICAgICAgICAgICBjYXNlICdmcm9tQXBwK2RlZmF1bHQnOlxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmdldEZhdmljb25PckFwcEljb24oYXBwKTtcbiAgICAgICAgICAgIGNhc2UgJ2RlZmF1bHQrZnJvbUFwcCc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRhYi5pY29uRnJvbUFwcCA/IHRhYi5pY29uRnJvbUFwcCA6IHRoaXMuZ2V0RmF2aWNvbk9yQXBwSWNvbihhcHApO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzaG93TW9yZU1lbnUgPSAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHsgdGFiIH0gPSB0aGlzLnByb3BzO1xuICAgICAgICBjb25zdCB7IE1lbnUsIE1lbnVJdGVtIH0gPSByZW1vdGU7XG5cbiAgICAgICAgY29uc3QgbWVudSA9IG5ldyBNZW51KCk7XG4gICAgICAgIGNvbnN0IGVkaXRJdGVtID0gbmV3IE1lbnVJdGVtKHtcbiAgICAgICAgICAgIGNsaWNrOiB0aGlzLnNob3dFZGl0VGFiRGlhbG9nLFxuICAgICAgICAgICAgbGFiZWw6IG1zZy5lZGl0QXBwLFxuICAgICAgICB9KTtcbiAgICAgICAgbWVudS5hcHBlbmQoZWRpdEl0ZW0pO1xuXG4gICAgICAgIGNvbnN0IGRlbGV0ZUl0ZW0gPSBuZXcgTWVudUl0ZW0oe1xuICAgICAgICAgICAgY2xpY2s6IHRoaXMuZGVsZXRlVGFiLFxuICAgICAgICAgICAgbGFiZWw6IG1zZy5kZWxldGVBcHAsXG4gICAgICAgIH0pO1xuICAgICAgICBtZW51LmFwcGVuZChkZWxldGVJdGVtKTtcblxuICAgICAgICBtZW51LmFwcGVuZChuZXcgTWVudUl0ZW0oe3R5cGU6ICdzZXBhcmF0b3InfSkpO1xuXG4gICAgICAgIC8vIG5vdGlmaWNhdGlvbiBtZW51XG4gICAgICAgIGNvbnN0IGFwcCA9IGFwcExpc3QuZmluZEFwcEJ5QXBwSWQodGFiLmFwcElkKTtcbiAgICAgICAgaWYgKGFwcCAhPT0gdW5kZWZpbmVkKSB7XG5cbiAgICAgICAgICAgIGNvbnN0IHN1Ym1lbnVzID0gW10gYXMgTWVudUl0ZW1Db25zdHJ1Y3Rvck9wdGlvbnNbXTtcbiAgICAgICAgICAgIGlmIChhcHAuZ2V0Tm90aWZpY2Fpb25UeXBlKCkgIT09IE5vdGlmaWNhdGlvblR5cGUuTk9UX1NVUFBPUlRFRCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5vdGlmaWNhdGlvbkl0ZW0gPSB7XG4gICAgICAgICAgICAgICAgICAgIGNsaWNrOiB0aGlzLnRvZ2dsZU5vdGlmaWNhdGlvbixcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6IHRhYi5ub3RpZmljYXRpb24gPyBtc2cubm90aWZpY2F0aW9uc1R1cm5PZmYgOiBtc2cubm90aWZpY2F0aW9uc1R1cm5PbixcbiAgICAgICAgICAgICAgICB9IGFzIE1lbnVJdGVtQ29uc3RydWN0b3JPcHRpb25zO1xuICAgICAgICAgICAgICAgIHN1Ym1lbnVzLnB1c2gobm90aWZpY2F0aW9uSXRlbSk7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBzcGVjaWFsTm90aWZpY2F0aW9uTGFiZWxNYXA6IHtba2V5OiBzdHJpbmddOiBzdHJpbmcgfCB1bmRlZmluZWR9ID0ge1xuICAgICAgICAgICAgICAgICAgICBzbGFjazogTWVzc2FnZXMuZ2V0KCkuYXBwUmVzb3VyY2VzLnNsYWNrLnNwZWNpYWxOb3RpZmljYXRpb24sXG4gICAgICAgICAgICAgICAgICAgIHR3aXR0ZXI6IE1lc3NhZ2VzLmdldCgpLmFwcFJlc291cmNlcy50d2l0dGVyLnNwZWNpYWxOb3RpZmljYXRpb24sXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBjb25zdCBzcGVjaWFsTm90aWZpY2F0aW9uTGFiZWwgPSBzcGVjaWFsTm90aWZpY2F0aW9uTGFiZWxNYXBbYXBwLmlkXTtcbiAgICAgICAgICAgICAgICBpZiAoc3BlY2lhbE5vdGlmaWNhdGlvbkxhYmVsKSB7XG4gICAgICAgICAgICAgICAgICAgIHN1Ym1lbnVzLnB1c2goe3R5cGU6ICdzZXBhcmF0b3InfSk7XG4gICAgICAgICAgICAgICAgICAgIHN1Ym1lbnVzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgZW5hYmxlZDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogYXBwLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzcGVjaWFsTm90aWZpY2F0aW9uID0gdGFiLnNldHRpbmdzLnNwZWNpYWxOb3RpZmljYXRpb24gPyB0cnVlIDogZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNwZWNpYWxJdGVtID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tlZDogc3BlY2lhbE5vdGlmaWNhdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsaWNrOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFiLnNldHRpbmdzLnNwZWNpYWxOb3RpZmljYXRpb24gPSAhc3BlY2lhbE5vdGlmaWNhdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdG9yZS5kaXNwYXRjaChjcmVhdGVVcGRhdGVUYWJBY3Rpb24odGFiLCBzdG9yZSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vdGlmaWNhdGlvbnMudXBkYXRlQXBwQmFkZ2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBlbmFibGVkOiB0YWIubm90aWZpY2F0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICcgICcgKyBzcGVjaWFsTm90aWZpY2F0aW9uTGFiZWwsXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnY2hlY2tib3gnLFxuICAgICAgICAgICAgICAgICAgICB9IGFzIE1lbnVJdGVtQ29uc3RydWN0b3JPcHRpb25zO1xuICAgICAgICAgICAgICAgICAgICBzdWJtZW51cy5wdXNoKHNwZWNpYWxJdGVtKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5vdGlmaWNhdGlvbkl0ZW0gPSB7XG4gICAgICAgICAgICAgICAgICAgIGNsaWNrOiB0aGlzLnRvZ2dsZU5vdGlmaWNhdGlvbixcbiAgICAgICAgICAgICAgICAgICAgZW5hYmxlZDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiBtc2cubm90aWZpY2F0aW9uc05vdFN1cHBvcnRlZCxcbiAgICAgICAgICAgICAgICB9IGFzIE1lbnVJdGVtQ29uc3RydWN0b3JPcHRpb25zO1xuICAgICAgICAgICAgICAgIHN1Ym1lbnVzLnB1c2gobm90aWZpY2F0aW9uSXRlbSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IG5vdGlmaWNhaXRvbkl0ZW0gPSBuZXcgTWVudUl0ZW0oe1xuICAgICAgICAgICAgICAgIGxhYmVsOiBtc2cubm90aWZpY2F0aW9ucyxcbiAgICAgICAgICAgICAgICBzdWJtZW51OiBzdWJtZW51cyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgbWVudS5hcHBlbmQobm90aWZpY2FpdG9uSXRlbSk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBpY29uSXRlbSA9IG5ldyBNZW51SXRlbSh7XG4gICAgICAgICAgICBsYWJlbDogbXNnLmljb24uaWNvbixcbiAgICAgICAgICAgIHN1Ym1lbnU6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNoZWNrZWQ6IHRhYi5pY29uVHlwZSA9PT0gdW5kZWZpbmVkIHx8IHRhYi5pY29uVHlwZSA9PT0gJ2RlZmF1bHQnLFxuICAgICAgICAgICAgICAgICAgICBjbGljazogKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jaGFuZ2VJY29uVHlwZSgnZGVmYXVsdCcpO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBsYWJlbDogbXNnLmljb24uZGVmYXVsdEljb24sXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdyYWRpbycsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAuLi4oYXBwICYmIGFwcC5nZXRJY29uVHlwZSgpID09PSBJY29uVHlwZS5TUEVDSUFMID8gW1xuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaGVja2VkOiB0YWIuaWNvblR5cGUgPT09ICdkZWZhdWx0K2Zyb21BcHAnLFxuICAgICAgICAgICAgICAgICAgICAgICAgY2xpY2s6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNoYW5nZUljb25UeXBlKCdkZWZhdWx0K2Zyb21BcHAnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogbXNnLmljb24uZGVmYXVsdFBsdXNGcm9tQXBwLFxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3JhZGlvJyxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tlZDogdGFiLmljb25UeXBlID09PSAnZnJvbUFwcCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGljazogKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2hhbmdlSWNvblR5cGUoJ2Zyb21BcHAnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogbXNnLmljb24uZnJvbUFwcCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdyYWRpbycsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrZWQ6IHRhYi5pY29uVHlwZSA9PT0gJ2Zyb21BcHArZGVmYXVsdCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGljazogKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2hhbmdlSWNvblR5cGUoJ2Zyb21BcHArZGVmYXVsdCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiBtc2cuaWNvbi5mcm9tQXBwUGx1c0RlZmF1bHQsXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAncmFkaW8nLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIF0gYXMgTWVudUl0ZW1Db25zdHJ1Y3Rvck9wdGlvbnNbXSA6IFtdIGFzIE1lbnVJdGVtQ29uc3RydWN0b3JPcHRpb25zW10pLFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgY2hlY2tlZDogdGFiLmljb25UeXBlID09PSAnY3VzdG9tJyxcbiAgICAgICAgICAgICAgICAgICAgY2xpY2s6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2hvb3NlQ3VzdG9tSWNvbigpO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBsYWJlbDogbXNnLmljb24uY3VzdG9tLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAncmFkaW8nLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICB9KTtcbiAgICAgICAgbWVudS5hcHBlbmQoaWNvbkl0ZW0pO1xuXG4gICAgICAgIGNvbnN0IG11dGVJdGVtID0gbmV3IE1lbnVJdGVtKHtcbiAgICAgICAgICAgIGNsaWNrOiB0aGlzLnRvZ2dsZU11dGVkLFxuICAgICAgICAgICAgbGFiZWw6IHRhYi5tdXRlZCA/IG1zZy51bm11dGUgOiBtc2cubXV0ZSxcbiAgICAgICAgfSk7XG4gICAgICAgIG1lbnUuYXBwZW5kKG11dGVJdGVtKTtcblxuICAgICAgICBtZW51LmFwcGVuZChuZXcgTWVudUl0ZW0oe3R5cGU6ICdzZXBhcmF0b3InfSkpO1xuICAgICAgICBidWlsZE1lbnVzRm9yVXJsKHRhYi51cmwsICdhZnRlckxhc3RUYWInLCB1bmRlZmluZWQsIHRhYikuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgICAgICAgbWVudS5hcHBlbmQobmV3IE1lbnVJdGVtKGl0ZW0pKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgbWVudS5wb3B1cCh7fSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjaG9vc2VDdXN0b21JY29uID0gKCkgPT4ge1xuICAgICAgICBjb25zdCB7IHRhYiB9ID0gdGhpcy5wcm9wcztcbiAgICAgICAgY29uc3Qgd2luID0gcmVtb3RlLkJyb3dzZXJXaW5kb3cuZ2V0Rm9jdXNlZFdpbmRvdygpO1xuICAgICAgICBpZiAoIXdpbikgeyByZXR1cm47IH1cbiAgICAgICAgY29uc3Qgb3B0cyA9IHtcbiAgICAgICAgICAgIGZpbHRlcnM6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGV4dGVuc2lvbnM6IFsncG5nJywgJ2pwZycsICdqcGVnJywgJ2dpZiddLFxuICAgICAgICAgICAgICAgICAgICBuYW1lOiAnSW1hZ2VzJyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHByb3BlcnRpZXM6IFsnb3BlbkZpbGUnXSxcbiAgICAgICAgfSBhcyBPcGVuRGlhbG9nU3luY09wdGlvbnM7XG4gICAgICAgIHJlbW90ZS5kaWFsb2cuc2hvd09wZW5EaWFsb2cod2luLCBvcHRzKVxuICAgICAgICAudGhlbigocmV0dXJuVmFsdWUpID0+IHtcbiAgICAgICAgICAgIC8vIGlmIChyZXR1cm5WYWx1ZS5jYW5jZWxlZCkgeyByZXR1cm47IH1cbiAgICAgICAgICAgIGlmICghcmV0dXJuVmFsdWUuZmlsZVBhdGhzXG4gICAgICAgICAgICAgICAgfHwgcmV0dXJuVmFsdWUuZmlsZVBhdGhzLmxlbmd0aCAhPT0gMSkgeyByZXR1cm47IH1cbiAgICAgICAgICAgIGNvbnN0IGZpbGVQYXRoID0gcmV0dXJuVmFsdWUuZmlsZVBhdGhzWzBdO1xuICAgICAgICAgICAgcmVzaXplQXNEYXRhVVJMKGBmaWxlOi8vJHtmaWxlUGF0aH1gLCA1MCwgNTApXG4gICAgICAgICAgICAudGhlbigoZGF0YVVybCkgPT4ge1xuICAgICAgICAgICAgICAgIHRhYi5pY29uQ3VzdG9tID0gZGF0YVVybDtcbiAgICAgICAgICAgICAgICB0YWIuaWNvblR5cGUgPSAnY3VzdG9tJztcbiAgICAgICAgICAgICAgICBzdG9yZS5kaXNwYXRjaChjcmVhdGVVcGRhdGVUYWJBY3Rpb24odGFiLCBzdG9yZSkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgY2hhbmdlSWNvblR5cGUgPSAoaWNvblR5cGU6IFRhYkljb25UeXBlKSA9PiB7XG4gICAgICAgIGNvbnN0IHsgdGFiIH0gPSB0aGlzLnByb3BzO1xuICAgICAgICBpZiAoaWNvblR5cGUgIT09ICdjdXN0b20nKSB7XG4gICAgICAgICAgICB0YWIuaWNvbkN1c3RvbSA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICB0YWIuaWNvblR5cGUgPSBpY29uVHlwZTtcbiAgICAgICAgc3RvcmUuZGlzcGF0Y2goY3JlYXRlVXBkYXRlVGFiQWN0aW9uKHRhYiwgc3RvcmUpKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGRlbGV0ZVRhYiA9ICgpID0+IHtcbiAgICAgICAgY29uc3Qgb2sgPSBjb25maXJtKG1zZy5kZWxldGVBcHBDb25maXJtTWVzc2FnZSk7XG4gICAgICAgIGlmIChvaykge1xuICAgICAgICAgICAgc3RvcmUuZGlzcGF0Y2goY3JlYXRlRGVsZXRlVGFiQWN0aW9uKHRoaXMucHJvcHMudGFiLmlkLCBzdG9yZSkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSB0b2dnbGVOb3RpZmljYXRpb24gPSAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHsgdGFiIH0gPSB0aGlzLnByb3BzO1xuICAgICAgICBpZiAodGFiLm5vdGlmaWNhdGlvbikge1xuICAgICAgICAgICAgdGFiLm5vdGlmaWNhdGlvbiA9IGZhbHNlO1xuICAgICAgICAgICAgc3RvcmUuZGlzcGF0Y2goY3JlYXRlVXBkYXRlVGFiQWN0aW9uKHRhYiwgc3RvcmUpKTtcbiAgICAgICAgICAgIG5vdGlmaWNhdGlvbnMudXBkYXRlQXBwQmFkZ2UoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRhYi5ub3RpZmljYXRpb24gPSB0cnVlO1xuICAgICAgICAgICAgc3RvcmUuZGlzcGF0Y2goY3JlYXRlVXBkYXRlVGFiQWN0aW9uKHRhYiwgc3RvcmUpKTtcbiAgICAgICAgICAgIC8vIFdlYnZpZXfjgpLnlJ/miJDjgZfjgIHpgJrnn6Xjga7nm6Poppblr77osaHjgavjgZnjgovjgZ/jgoHjgavlvLfliLbpgbjmip5cbiAgICAgICAgICAgIHN0b3JlLmRpc3BhdGNoKGNyZWF0ZVNlbGVjdFRhYkFjdGlvbih0YWIuaWQsIHN0b3JlKSk7XG4gICAgICAgICAgICBub3RpZmljYXRpb25zLnVwZGF0ZUFwcEJhZGdlKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIHRvZ2dsZU11dGVkID0gKCkgPT4ge1xuICAgICAgICBjb25zdCB7IHRhYiB9ID0gdGhpcy5wcm9wcztcbiAgICAgICAgaWYgKHRhYi5tdXRlZCkge1xuICAgICAgICAgICAgdGFiLm11dGVkID0gZmFsc2U7XG4gICAgICAgICAgICBzdG9yZS5kaXNwYXRjaChjcmVhdGVVcGRhdGVUYWJBY3Rpb24odGFiLCBzdG9yZSkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGFiLm11dGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHN0b3JlLmRpc3BhdGNoKGNyZWF0ZVVwZGF0ZVRhYkFjdGlvbih0YWIsIHN0b3JlKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIG9wZW5MaW5rSW5OZXdXaW5kb3cgPSAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHsgaWQsIHVybCB9ID0gdGhpcy5wcm9wcy50YWI7XG4gICAgICAgIGNvbnN0IHRhYldpdGhHcm91cCA9IGZpbmRUYWJXaXRoVGFiR3JvdXBCeVRhYklkKHN0b3JlLmdldFN0YXRlKCkuZ3JvdXBMaXN0LnRhYkdyb3VwcywgaWQpO1xuICAgICAgICBpZiAoIXRhYldpdGhHcm91cCkgeyByZXR1cm47IH1cblxuICAgICAgICBjb25zdCBwZXJzaXN0SWQgPSBnZXRQZXJzaXN0SWQodGFiV2l0aEdyb3VwLnRhYkdyb3VwLCB0YWJXaXRoR3JvdXAudGFiKTtcbiAgICAgICAgaXBjUmVuZGVyZXIuc2VuZCgnb3Blbi1uZXctd2luZG93JywgcGVyc2lzdElkLCB1cmwpO1xuICAgIH1cblxuICAgIHByaXZhdGUgb25DbGlja1NlbGVjdCA9IChlOiBSZWFjdC5Nb3VzZUV2ZW50KSA9PiB7XG4gICAgICAgIHN0b3JlLmRpc3BhdGNoKGNyZWF0ZVNlbGVjdFRhYkFjdGlvbih0aGlzLnByb3BzLnRhYi5pZCwgc3RvcmUpKTtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIG9uQ2xpY2tNb3JlID0gKGU6IFJlYWN0Lk1vdXNlRXZlbnQpID0+IHtcbiAgICAgICAgdGhpcy5zaG93TW9yZU1lbnUoKTtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIG9uQ29udGV4dE1lbnUgPSAoZTogUmVhY3QuTW91c2VFdmVudCkgPT4ge1xuICAgICAgICB0aGlzLnNob3dNb3JlTWVudSgpO1xuICAgICAgICAvLyBuZWVkIHByZXZlbnREZWZhdWx0IGZvciBXaW5kb3dzXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHNob3dFZGl0VGFiRGlhbG9nID0gKCkgPT4ge1xuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIG1vZGU6IE1vZGUuRWRpdGluZyxcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBoaWRlRWRpdFRhYkRpYWxvZyA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICBtb2RlOiBNb2RlLk5vcm1hbCxcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBvbkNsb3NlID0gKCkgPT4ge1xuICAgICAgICB0aGlzLmhpZGVFZGl0VGFiRGlhbG9nKCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBvbkVycm9ySW1nVGFiSWNvbiA9IChlOiBhbnkpID0+IHtcbiAgICAgICAgY29uc3QgY3VycmVudFNyYyA9IGUuY3VycmVudFRhcmdldC5nZXRBdHRyaWJ1dGUoJ3NyYycpO1xuICAgICAgICBpZiAoIW5hdmlnYXRvci5vbkxpbmUgfHwgIWN1cnJlbnRTcmMgfHwgaXNHb29nbGVGYXZpY29uVXJsKGN1cnJlbnRTcmMpKSB7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHsgZmF2aWNvbkxvYWRGYWlsZWQ6IHRydWUgfSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB7IHRhYiB9ID0gdGhpcy5wcm9wcztcbiAgICAgICAgY29uc3QgYXBwID0gYXBwTGlzdC5maW5kQXBwQnlBcHBJZCh0YWIuYXBwSWQpO1xuICAgICAgICBjb25zdCBjdXJyZW50VXJsID0gdGhpcy5nZXRGYXZpY29uT3JBcHBJY29uKGFwcCk7XG4gICAgICAgIGNvbnN0IGZhbGxiYWNrVXJsID0gZ2V0R29vZ2xlRmF2aWNvblVybE9yRW1wdHkoY3VycmVudFVybCk7XG4gICAgICAgIGlmICghZmFsbGJhY2tVcmwpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoeyBmYXZpY29uTG9hZEZhaWxlZDogdHJ1ZSB9KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgIGZhdmljb25Mb2FkRmFpbGVkOiBmYWxzZSxcbiAgICAgICAgICAgIGZhdmljb25Vcmw6IGZhbGxiYWNrVXJsLFxuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFRhYlJvdztcbiJdfQ==

/***/ }),