/*jshint esversion: 6 */

m.route(document.body, "/", {
    "/" : {
        onmatch: function() {
            return MyApp.Timeline;
        }
    },
    "/home" : {
        onmatch: function() {
            if (!auth2.isSignedIn.get()) return MyApp.NotSignedIn;
            else return MyApp.Timeline;
        }
    },
    "/profile": {
        onmatch: function() {
            if (!auth2.isSignedIn.get()) m.route.set("/login");
            else {
                MyApp.User.userData = {};
                MyApp.Profile.getPosts();
                return MyApp.Profile;
            }
        }
    },
    "/search": {
        onmatch : function () {
            return MyApp.SearchedUsersList;
        }
    },
    "/user": {
        onmatch : function () {
            if(Object.keys(MyApp.User.userData).length !=0) return MyApp.User;
            else {
                m.route.set("/");
            }
        }
    },
    "/login": {
        onmatch: function () {
            return MyApp.Login;
        }
    },
    "/admin": {
        onmatch: function () {
            return MyApp.Admin;
        }
    }
});

var showProfile = false;
var showSearchList = false;
var showTimeline = false;

var isLoggedIn = false;
var auth2;
var googleUser; // The current user


gapi.load('auth2', function() {
    auth2 = gapi.auth2.init({
        client_id: "834229904246-7e02hoftjchsgnkh2a1be93ao1u7ip4o.apps.googleusercontent.com"
    });
    auth2.attachClickHandler('signin-button', {}, onSuccess, onFailure);

    auth2.isSignedIn.listen(signinChanged);
    auth2.currentUser.listen(userChanged); // This is what you use to listen for user changes
});

var signinChanged = function (loggedIn) {

    if (auth2.isSignedIn.get()) {
        googleUser = auth2.currentUser.get();
        isLoggedIn = loggedIn;
        if(loggedIn) {
            MyApp.Profile.userData.name = googleUser.getBasicProfile().getName();
            MyApp.Profile.userData.email = googleUser.getBasicProfile().getEmail();
            MyApp.Profile.userData.firstName = googleUser.getBasicProfile().getGivenName();
            MyApp.Profile.userData.lastName= googleUser.getBasicProfile().getFamilyName();
            MyApp.Profile.userData.id = googleUser.getAuthResponse().id_token;
            MyApp.Profile.userData.url = googleUser.getBasicProfile().getImageUrl();

        } else {
            MyApp.Profile.userData.name = "";
            MyApp.Profile.userData.firstName = "";
            MyApp.Profile.userData.lastName = "";
            MyApp.Profile.userData.email = "";
            MyApp.Profile.userData.id = "";
            MyApp.Profile.userData.url = "";
        }
    }
};

var onSuccess = function(user) {
    googleUser = user;
    var profile = user.getBasicProfile();

    MyApp.Profile.userData.name = profile.getName();
    MyApp.Profile.userData.firstName = profile.getGivenName();
    MyApp.Profile.userData.lastName= profile.getFamilyName();
    MyApp.Profile.userData.email = profile.getEmail();
    MyApp.Profile.userData.id = user.getAuthResponse().id_token;
    MyApp.Profile.userData.url = profile.getImageUrl();

    isLoggedIn=true;

    MyApp.Profile.createUser();
    MyApp.Timeline.getTimeline();

    m.route.set("/home");
};

var onFailure = function(error) {
    console.log(error);
};

function signOut() {
    auth2.signOut().then(function () {
        console.log('User signed out.');
        window.location.reload();
    });
}

var userChanged = function (user) {
    if(user.getId()){
      // Do something here
    }
};

var MyApp = {
    view: function (ctrl) {
        return (
            m("div", [
                m(MyApp.Navbar, {}),

            ])
        );
    }
};

MyApp.Navbar = {
    view: function () {
        return (m("nav.navbar.navbar-expand-lg.navbar-light.mb-3", [
            m(".collapse.navbar-collapse[id='navbarSupportedContent']", [
                m("ul.navbar-nav.mr-auto", [
                    m("li.nav-item mr-5", [
                        m(MyApp.signInButton),
                    ]),
                    m("li.nav-item",
                        m("h2",
                            m(m.route.Link, {href: "/home", oncreate: m.route.link, onupdate: m.route.link, class:"nav-link"}, ["Home ",m("span.sr-only", "(current)")])
                        )
                    ),
                    m("li.nav-item",
                        m("h2",
                            m(m.route.Link, {href: "/profile", oncreate: m.route.link, onupdate: m.route.link, class:"nav-link"}, "My Profile")
                        )
                    )
                ]),
                m(MyApp.Searchbar)
            ])
        ]));
    },

};

MyApp.signInButton = {
    view: function () {
        return m("div", {
                "class":"g-signin2",
                "id":"signin-button"
            }
        );
    }
};

MyApp.Searchbar = {
    view: function () {
        if(MyApp.Profile.userData.id!="") {
            return m("div.form-inline", [
                m("div",
                    m("form.form-inline.my-2.my-lg-0[action='/search'][method='post']", {
                        id:"searchForm"
                    }, [
                        m("input.form-control.mr-sm-2[aria-label='Search'][id='search'][name='search'][placeholder='Search users'][type='search']"),
                        m("input[id='me'][name='me'][type='hidden'][value=" + MyApp.Profile.userData.email + "]"),
                        m("button.btn.btn-outline-success.my-2.my-sm-0.mr-2[type='submit']",{
                            onclick: function (e) {
                                e.preventDefault();
                                MyApp.Searchbar.searchUser();
                            }
                        } , "Search"),
                    ])
                ),
                m(MyApp.profilePicAndSignOut)
            ]);
        } else {
            return (
                m("form.form-inline.my-2.my-lg-0[action='/search'][method='post']", [
                    m("input.form-control.mr-sm-2[aria-label='Search'][id='search'][name='search'][placeholder='Please connect beforehand'][type='search'] [disabled='true']"),
                    m("button.btn.btn-outline-success.my-2.my-sm-0[type='submit'] [disabled='true']", "Search")
                ])
            );
        }
    },
    searchUser: function () {
        m.request({
            method: "GET",
            params: {
                'email': MyApp.Profile.userData.email,
                'search':$("#search").val(),
                'access_token': encodeURIComponent(MyApp.Profile.userData.id)
            },
            url: "_ah/api/user_api/1.0/getSearchUser"
        })
        .then(function(response) {
            console.log("users:",response);
            var i = 0;
            var tinyUser = {};
            if(response.items === undefined) {
                MyApp.SearchedUsersList.tinyUserList= [];

            } else {
                response.items.forEach(function (item) {
                    var friend = false;
                    item.properties.followers.forEach(function (follower) {
                        if (follower == MyApp.Profile.userData.email) {
                            friend = true;
                        }
                    });
                    tinyUser=item.properties;
                    MyApp.SearchedUsersList.tinyUserList[i] = {
                        email:tinyUser.email,
                        name:tinyUser.name,
                        invertedName:tinyUser.invertedName,
                        firstName:tinyUser.firstName,
                        lastName:tinyUser.lastName,
                        url:tinyUser.url,
                        friend:friend,
                    };
                    i++;
                });
                console.log(MyApp.SearchedUsersList.tinyUserList);
            }
            m.route.set("/search");
        });
    }
};

MyApp.profilePicAndSignOut = {
    view: function () {
        if(MyApp.Profile.userData.id!="") {
            return m("div.form-inline.my-2.my-lg-0", [
                m("span[aria-controls='collapseSignOut'][aria-expanded='false'][data-target='#collapseSignOut'][data-toggle='collapse']",
                    m("img.mr-sm-2", {
                        class:"profile_image",
                        "style":"height:42px",
                        "src":MyApp.Profile.userData.url,
                        "alt":MyApp.Profile.userData.name,
                    })
                ),
                m(".collapse[id='collapseSignOut'].my-2.my-sm-", [
                    m("button.btn.btn-info", {
                        onclick: function () {
                            signOut();
                        }
                    }, "Sign Out")
                ]),
                ]);
        } else {
            return m("div");
        }
    }
};

MyApp.SearchedUsersList = {
    tinyUserList: [],
    view: function (vnode) {
        return (
            m("div",
                m(MyApp.Navbar),
                MyApp.SearchedUsersList.tinyUserList.length != 0 ?
                    m("div.container", [
                        m('table', {
                            class:'table is-striped',
                            "table":"is-striped"
                        },[
                            MyApp.SearchedUsersList.tinyUserList.map(function(tinyUser) {
                                return m("tr", {
                                    "style":"height:9vh"
                                }, [
                                    m('td', {
                                        "style":"width:10vw",
                                        onclick: function () {
                                            MyApp.SearchedUsersList.goToUser(tinyUser.email);
                                        }
                                    },  m('img',
                                        {
                                            "style":"height:8vh",
                                            class:"profile_image",
                                            'src': tinyUser.url,
                                            'alt':tinyUser.name,
                                        })
                                    ),
                                    m('td.inline', {
                                        "style":"width:80vw",
                                        onclick: function () {
                                            MyApp.SearchedUsersList.goToUser(tinyUser.email);
                                        }
                                    }, [
                                        m('h1', tinyUser.name),
                                        m('span', "("+tinyUser.email+")"),
                                    ]),
                                    m('td', {
                                        "style":"width:12vw"
                                    }, m('button.btn.float-right', {
                                        class:tinyUser.friend?"btn-danger":"btn-success",
                                        id: "btn_follow",
                                        onclick: function () {
                                            MyApp.SearchedUsersList.followUser(tinyUser);
                                        }
                                    }, tinyUser.friend?"Followed":"Follow")
                                    )
                                ]);
                            })
                        ])
                    ])
                    :
                    m("div.container",
                        m("h1.title", "No user found for your search...")
                    )
            )
        );
    },
    goToUser: function (email) {
        m.request({
            method: "GET",
            params: {
                'email': email,
            },
            url: "_ah/api/user_api/1.0/getUser"+'?access_token='+encodeURIComponent(MyApp.Profile.userData.id),        })
        .then(function (response) {
            var tinyUser = response.properties;
            var friend = false;
            var followers_count = -1;

            tinyUser.followers.forEach(function (follower) {
                followers_count++;
                if (follower == MyApp.Profile.userData.email) {
                    friend = true;
                }
            });

            MyApp.User.userData = {
                email:tinyUser.email,
                name:tinyUser.name,
                invertedName:tinyUser.invertedName,
                firstName:tinyUser.firstName,
                lastName:tinyUser.lastName,
                url:tinyUser.url,
                friend: friend,
                followers_count: followers_count,
                nextToken:"",
                posts:[],
            };
            MyApp.User.getPosts();
            m.route.set("/user");
        });
    },
    followUser: function (tinyUser) {
        var data = {
            'askingUser': MyApp.Profile.userData.email,
            'targetUser': tinyUser.email,
        };
        if (!tinyUser.friend) {
            return m.request ({
                method: "POST",
                url: "_ah/api/user_api/1.0/followUser"+'?access_token='+encodeURIComponent(MyApp.Profile.userData.id),                                                    params: data,
            }).then(function () {
                tinyUser.friend = true;
                document.getElementById("btn_follow").class = "btn-danger";
                console.log("Followed");
            });
        } else {
            return m.request ({
                method: "POST",
                url: "_ah/api/user_api/1.0/unfollowUser"+'?access_token='+encodeURIComponent(MyApp.Profile.userData.id),                                                    params: data,
            }).then(function () {
                tinyUser.friend = false;
                document.getElementById("btn_follow").class = "btn-success";
                console.log("Unfollowed");
            });
        }
    }
};


MyApp.User = {
    userData: {},
    view: function (vnode) {
        return (
            m('div',[
                m(MyApp.Navbar),
                m('div', {class:'container'},[
                    m('div', {class:"row"},[
                        m('div', {class:"col-md-2 col-sm-2 col-xs-2"},
                            m("img", {
                                class:"profile_image",
                                "src":MyApp.User.userData.url,
                                "alt":MyApp.User.userData.name+"'s profile picture"
                            })
                        ),
                        m('div', {class:"col-md-3 col-sm-3 col-xs-3"},
                            m("h1", {
                                class: 'title'
                            }, MyApp.User.userData.name),
                            m("h2", {
                                class: 'subtitle'
                            }, MyApp.User.userData.email)
                        ),
                        m("div", {class:"col-md-3 col-sm-3 col-xs-3"},
                            m("h2.subtitle", MyApp.User.userData.followers_count +" abonné(es)")
                        ),
                        MyApp.Profile.userData.email != MyApp.User.userData.email?
                            m('div', {class:"col-md-4 col-sm-4 col-xs-4"},
                                m("button.btn.float-right", {
                                    class: MyApp.User.userData.friend?"btn-danger":"btn-success",
                                    onclick: function () {
                                        MyApp.User.followUser();
                                    }
                                }, MyApp.User.userData.friend?"Unfollow":"Follow")
                            ):
                            m('div', {class:"col-md-4 col-sm-4 col-xs-4"},
                                m("span.btn.float-left", {
                                    class:"btn-outline-info",
                                    style:"cursor:inherit",
                                    onclick: function () {
                                        m.route.set("/profile");
                                    }
                                }, "This is your public profile (click to access to your profile)")
                            )]
                    ),
                    m("div",m(MyApp.PostView,{profile: MyApp.User, owned:false}))
                ]),
            ])
        );
    },
    getPosts: function() {
        return m.request({
            method: "GET",
            url: "_ah/api/post_api/1.0/getPost",
            params: {
                'email':MyApp.User.userData.email,
                'access_token':encodeURIComponent(MyApp.Profile.userData.id)
            }
        })
        .then(function(response) {
            console.log("load_list:",response);
            MyApp.User.userData.posts=response.items;
            if ('nextPageToken' in response) {
                MyApp.User.userData.nextToken= response.nextPageToken;
            } else {
                MyApp.User.userData.nextToken="";
            }
        });
    },
    getNextPosts: function() {
        console.log(MyApp.Profile.userData.nextToken);
        return m.request({
            method: "GET",
            url: "_ah/api/post_api/1.0/getPost",
            params: {
                'email':MyApp.User.userData.email,
                'next':MyApp.User.userData.nextToken,
                'access_token': encodeURIComponent(MyApp.Profile.userData.id)
            }
        })
        .then(function(response) {
            if(response.items !=  undefined) {
                MyApp.User.userData.posts = response.items;
            }
            if ('nextPageToken' in response) {
                MyApp.User.userData.nextToken= response.nextPageToken;
            } else {
                MyApp.User.userData.nextToken="";
            }
        });
    },
    followUser: function () {
        var data = {
            'askingUser': MyApp.Profile.userData.email,
            'targetUser': MyApp.User.userData.email,
        };
        if (!MyApp.User.userData.friend) {
            return m.request ({
                method: "POST",
                url: "_ah/api/user_api/1.0/followUser"+'?access_token='+encodeURIComponent(MyApp.Profile.userData.id),                                                params: data,
            }).then(function () {
                MyApp.User.userData.friend = true;
                MyApp.User.userData.followers_count++;
                m.redraw();
                console.log("Followed");
            });
        } else {
            return m.request ({
                method: "POST",
                url: "_ah/api/user_api/1.0/unfollowUser"+'?access_token='+encodeURIComponent(MyApp.Profile.userData.id),                                                params: data,
            }).then(function () {
                MyApp.User.userData.friend = false;
                MyApp.User.userData.followers_count--;
                m.redraw();
                console.log("Unfollowed");
            });
        }
    }
};

MyApp.Timeline = {
    posts: [],
    loading_gif: false,
    view: function () {
        if (MyApp.Profile.userData.id == "") return m(MyApp.NotSignedIn);
        else {
            return m("div", [
                m(MyApp.Navbar),
                m("div.container", [
                    m("h1.title","This is your timeline"),
                    m("button.btn.mb-5", {
                        onclick: function () {
                            MyApp.Timeline.getTimeline();
                        }
                    }, "Get your timeline"),
                        MyApp.Timeline.loading_gif?
                            m("div",
                                m("img", {
                                    "style":"text-center",
                                    "src":"static/images/loading.gif",
                                    "alt":"Loading..."
                                })
                            )
                            :
                            MyApp.Timeline.posts.length==0?
                                m("div",
                                    m("span", "No new post to show")
                                ):
                                m('table', {
                                    class:'table is-striped',"table":"is-striped"
                                },[
                                    m('tr', [
                                        m('th', {
                                            "style":"width:20vw"
                                        }, ""),
                                        m('th', {
                                            "style":"width:40vw"
                                        }, "Post"),
                                        m('th', {
                                            "style":"width:25vw"
                                        }, "Caption"),
                                        m('th', {
                                            "style":"width:5vw"
                                        }, "Likes"),
                                        m('th', {
                                            "style":"width:10vw"
                                        }),
                                    ]),
                                    MyApp.Timeline.posts.map(function(post) {
                                        return m("tr", [
                                            m('td', {
                                                "style":"width:20vw",
                                                onclick: function () {
                                                    MyApp.Timeline.goToUser(post.owner);
                                                }
                                            }, [
                                                /*m("h1", post.tinyUser.name),*/
                                                m("h2", post.owner),
                                                /*m('img', {
                                                    class:"profile_image",
                                                    'src': post.tinyUser.url
                                                })*/
                                            ]),
                                            m('td', {
                                                "style":"width:40vw"
                                            }, m('img', {
                                                    'src': post.url
                                                })
                                            ),
                                            m('td', {
                                                "style":"width:25vw"
                                            }, m('label', post.body)
                                            ),
                                            m('td', {
                                                "style":"width:5vw"
                                            },
                                                m('label',
                                                    post.likes
                                                )
                                            ),
                                            m("td", {
                                                "style":"width:10vw"
                                            },
                                                    m("button", {
                                                        "class":"btn btn-success",
                                                        onclick: function () {
                                                            MyApp.Timeline.likePost(post.key.name);
                                                        },
                                                },
                                                "Like")
                                            )
                                        ]);
                                    })
                                ]),
                                m('button',{
                                    class: 'btn btn-info float-right mt-3',
                                    onclick: function(e) {
                                        MyApp.Timeline.getNextPosts();
                                    }
                                }, "Next"),

                ])
            ]);
        }
    },
    getTimeline : function () {
        MyApp.Timeline.loading_gif = true;
        m.request({
            method: "GET",
            url: "_ah/api/post_api/1.0/getTimeline"+'?access_token=' + encodeURIComponent(MyApp.Profile.userData.id)
        })
        .then(function(response) {
            showTimeline = true;
            MyApp.Timeline.loading_gif = false;
            var i = 0;
            if (response.items === undefined) {
                MyApp.Timeline.posts = [];
            } else {
                response.items.forEach( function (post) {
                    MyApp.Timeline.posts[i] = {
                        "key":post.key,
                        "owner":post.properties.owner,
                        "date":post.properties.date,
                        "body":post.properties.body,
                        "url":post.properties.url,
                        "likes":post.properties.likes,
                        "receivers":post.properties.receivers,
                    };
                    i++;
                });
                if ('nextPageToken' in response) {
                    MyApp.Profile.userData.nextToken = response.nextPageToken;
                } else {
                    MyApp.Profile.userData.nextToken="";
                }
            }
        });
    },
    getNextPosts: function() {
        console.log(MyApp.Profile.userData.nextToken);
        return m.request({
            method: "GET",
            url: "_ah/api/post_api/1.0/getTimeline",
            params: {
                'next':MyApp.Profile.userData.nextToken,
                'access_token': encodeURIComponent(MyApp.Profile.userData.id)
            }
        })
        .then(function(response) {
            showTimeline = true;
            MyApp.Timeline.loading_gif = false;
            var i = 0;
            if (response.items != undefined) {
                response.items.forEach( function (post) {
                    MyApp.Timeline.posts[i] = {
                        "key":post.key,
                        "owner":post.properties.owner,
                        "date":post.properties.date,
                        "body":post.properties.body,
                        "url":post.properties.url,
                        "likes":post.properties.likes,
                        "receivers":post.properties.receivers,
                    };
                    i++;
                });
                if ('nextPageToken' in response) {
                    MyApp.Profile.userData.nextToken = response.nextPageToken;
                } else {
                    MyApp.Profile.nextToken="";
                }
            }
        });
    },
    likePost: function (postLiked) {
	    var data = {
            'postLiked': postLiked,
            'email': MyApp.Profile.userData.email
        };
        m.request ({
	 		method: "POST",
            url: "_ah/api/like_api/1.0/newLike"+'?access_token='+encodeURIComponent(MyApp.Profile.userData.id),
            params: data,
		}).then(function(response){
            console.log(postLiked+ "successfully liked");
            MyApp.Timeline.getTimeline();
            m.redraw();
        });
    },
    goToUser: function (email) {
        m.request({
            method: "GET",
            params: {
                'email': email,
            },
            url: "_ah/api/user_api/1.0/getUser"+'?access_token='+encodeURIComponent(MyApp.Profile.userData.id),        })
        .then(function (response) {
            var tinyUser = response.properties;
            MyApp.User.userData = {
                email:tinyUser.email,
                name:tinyUser.name,
                invertedName:tinyUser.invertedName,
                firstName:tinyUser.firstName,
                lastName:tinyUser.lastName,
                url:tinyUser.url,
                nextToken:"",
                posts:[],
            };
            m.route.set("/user");
        });
    }
};

MyApp.NotSignedIn = {
    view: function () {
        return m("div", [
            m(MyApp.Navbar),
            m("div.container", [
                m("div.row.mb-3",
                    m("div", {
                        class:"title col-md-12 col-sm-12 col-xs-12"
                    },
                        m("h1", "Join us on Tinygram to see your friends' posts !"))
                ),
                m("div.row.mt-1", [
                    m("div", {
                        class:"col-md-4 col-sm-4 col-xs-4"
                    },m("img.my-auto", {
                        "src":"static/images/japanese_bridge.jpg",
                        "alt":"Japanese bridge"
                    })),
                    m("div", {
                        class:"col-md-4 col-sm-4 col-xs-4"
                    },m("img.my-auto", {
                        "src":"static/images/instagram_101.jpg",
                        "alt":"would-be-nice-on-insta-101"
                    })),
                    m("div", {
                        class:"col-md-4 col-sm-4 col-xs-4"
                    },m("img.my-auto", {
                        "src":"static/images/floating-homes-in-the-beautiful-dusk-light.jpg",
                        "alt":"Floating homes in the beautiful dusk light"
                    })),
                ]),
                m("div.row.mt-1", [
                    m("div", {
                        class:"col-md-4 col-sm-4 col-xs-4"
                    },m("img.my-auto", {
                        "src":"static/images/skyrim.jpg",
                        "alt":"skyrim > real world"
                    })),
                    m("div", {
                        class:"col-md-4 col-sm-4 col-xs-4"
                    },m("img.my-auto", {
                        "src":"static/images/sun_behind_trees.jpg",
                        "alt":"The sun behind trees (it always is behind things tho)"
                    })),
                    m("div", {
                        class:"col-md-4 col-sm-4 col-xs-4"
                    },m("img.my-auto", {
                        "src":"static/images/kaermorhen.jpg",
                        "alt":"Kaer morhen looks nice"
                    }))
                ]),
                m("div.row.mt-1", [
                    m("div", {
                        class:"col-md-4 col-sm-4 col-xs-4"
                    },m("img.my-auto", {
                        "src":"static/images/trees.jpg",
                        "alt":"Mmmmmmh... trees"
                    })),
                    m("div", {
                        class:"col-md-4 col-sm-4 col-xs-4"
                    },m("img.my-auto", {
                        "src":"static/images/winter_sunset.jpg",
                        "alt":"Winter is gorgeous but kinda sucks anyway"
                    })),
                    m("div", {
                        class:"col-md-4 col-sm-4 col-xs-4"
                    },m("img.my-auto", {
                        "src":"static/images/windows_like.jpg",
                        "alt":"Is it a windows wallpaper ??"
                    }))
                ]),
            ])
        ]);
    }
};

MyApp.Profile = {
    userData: {
        name: "",
        firstName: "",
        lastName: "",
        email: "",
        id: "",
        url: "",
        content:"",
        nextToken:"",
        followers_count:0,
        posts:[],
    },
    view: function(){
        return m('div',[
            m(MyApp.Navbar),
            m('div', {class:'container mt-5'},[
                m('div', {class:"row"},[
                    m('div', {class:"col-md-2 col-sm-2 col-xs-2"},
                        m("img", {
                            class:"profile_image",
                            "src":MyApp.Profile.userData.url
                        })
                    ),
                    m('div', {class:"col-md-5 col-sm-5 col-xs-5"},
                        m("h1", {
                            class: 'title'
                        }, MyApp.Profile.userData.name),
                        m("h2", {
                            class: 'subtitle'
                        }, MyApp.Profile.userData.email)
                    ),
                    m("div", {class:"col-md-3 col-sm-3 col-xs-3"},
                        m("h2.subtitle", MyApp.Profile.userData.followers_count +" abonné(es)")
                    ),
                    m('div', {class:"col-md-2 col-sm-2 col-xs-2"},
                        m("button", {
                            class:"btn btn-info float-right",
                            onclick: function () {
                                MyApp.Profile.getPosts();
                            },
                        },"Load Messages")
                    )]
                ),
                m("p",{class: 'my-5'}, [
                    m("button.btn.btn-success[aria-controls='collapseNewPost'][aria-expanded='false'][data-target='#collapseNewPost'][data-toggle='collapse'][type='button']", "Make a new Post"),
                ]),
                m(".collapse[id='collapseNewPost'].mb-5", [
                    m("form", {
                        onsubmit: function(e) {
                            e.preventDefault();
                            var post_url = "";
                            var post_body = "";
                            if ($("#new_post_url").val()=="") post_url="https://dummyimage.com/320x200/000/fff&text="+Date.now();
                            else post_url = $("#new_post_url").val();
                            if ($("#new_post_body").val()=="") post_body="bla bla bla \n"+Date.now();
                            else post_body = $("#new_post_body").val();
                            MyApp.Profile.newPost(post_url,post_body,false);
                        }},
                        [
                            m('div', {
                                class:'field'
                            },[
                                m("label", {
                                    class:'label',
                                },"URL"),
                                m('div',{class:'control'},
                                    m("input[type=text]", {
                                        class:'input is-rounded',
                                        placeholder:"Your url",
                                        id:"new_post_url"
                                    })
                                ),
                            ]),
                            m('div',{class:'field'},[
                                m("label", {class: 'label'},"Body"),
                                m('div',{class:'control'},
                                    m("input[type=textarea]", {
                                        class:'textarea',
                                        placeholder:"your text",
                                        id:"new_post_body"
                                    })
                                ),
                            ]),
                            m('div',{class:'control mt-3'},
                                m("button[type=submit]", {
                                    class:'float-right btn btn-success'
                                },"Post")
                            ),
                        ]
                    ),
                    m("br.mt-3"),
                    m("button.mt-3", {
                        class:"btn btn-info float-right",
                        onclick: function () {
                            MyApp.Profile.newPost();
                        },
                    },"Post Random Message"),
                ]),
                m("div",m(MyApp.PostView,{profile: MyApp.Profile, owned: true}))
            ])
        ]);
    },
    getPosts: function() {
        return m.request({
            method: "GET",
            url: "_ah/api/post_api/1.0/getPost",
            params : {
                'email':MyApp.Profile.userData.email,
                'access_token': encodeURIComponent(MyApp.Profile.userData.id)
            }
        })
        .then(function(response) {
            console.log("load_list:",response);
            MyApp.Profile.userData.posts=response.items;
            if ('nextPageToken' in response) {
                MyApp.Profile.userData.nextToken= response.nextPageToken;
            } else {
                MyApp.Profile.userData.nextToken="";
            }
        });
    },
    getNextPosts: function() {
        return m.request({
            method: "GET",
            url: "_ah/api/post_api/1.0/getPost",
            params: {
                'email':MyApp.User.userData.email,
                'next':MyApp.Profile.userData.nextToken,
                'access_token': encodeURIComponent(MyApp.Profile.userData.id)
            }
        })
        .then(function(response) {
            if(response.items != undefined) {
                MyApp.Profile.userData.posts = response.items;
                if ('nextPageToken' in response) {
                    MyApp.Profile.userData.nextToken = response.nextPageToken;
                } else {
                    MyApp.Profile.nextToken = "";
                }
            }
        });
    },
    newPost: function(url, body, random=true) {
        var data= {};
        if(random) {
            data= {
                'url': "https://dummyimage.com/320x200/000/fff&text="+Date.now(),
                'body': "bla bla bla",
                'access_token': encodeURIComponent(MyApp.Profile.userData.id)
        };
        } else {
            data= {
                'url': url,
                'body': body,
                'access_token': encodeURIComponent(MyApp.Profile.userData.id)
            };
        }
        return m.request({
            method: "POST",
            url: "_ah/api/post_api/1.0/newPost",
            params: data,
        })
        .then(function(response) {
            MyApp.Profile.getPosts();
        });
    },
    createUser: function() {
        var data = {
            'email': MyApp.Profile.userData.email,
            'firstName': MyApp.Profile.userData.firstName,
            'lastName': MyApp.Profile.userData.lastName,
            'name': MyApp.Profile.userData.name,
            'invertedName': MyApp.Profile.userData.lastName + " " + MyApp.Profile.userData.firstName,
            'url': MyApp.Profile.userData.url,
            'access_token': encodeURIComponent(MyApp.Profile.userData.id)
        };
        m.request ({
            method: "POST",
            url: "_ah/api/user_api/1.0/createUser",
            params: data,
        }).then(function (response){
            MyApp.Profile.userData.followers_count = response.properties.followers.length-1;
        });
    },
};

MyApp.PostView = {
    view: function(vnode) {
        return m('div', [
            m('div.mt-3.mb-3', {
                class:'subtitle'
            },
                m("h3",vnode.attrs.owned?"My Posts":vnode.attrs.profile.userData.name+"'s Posts")
            ),
            m('table', {
                class:'table is-striped',"table":"is-striped"
            },[
                vnode.attrs.owned?
                m('tr', [
                    m('th', {
                        "style":"width:40vw"
                    }, "Post"),
                    m('th', {
                        "style":"width:30vw"
                    }, "Caption"),
                    m('th', {
                        "style":"width:5vw"
                    }, "Likes"),
                    m('th', {
                        "style":"width:10vw"
                    }),
                    m('th', {
                        "style":"width:10vw"
                    }),
                ]):
                m('tr', [
                    m('th', {
                        "style":"width:50vw"
                    }, "Post"),
                    m('th', {
                        "style":"width:30vw"
                    }, "Caption"),
                    m('th', {
                        "style":"width:5vw"
                    }, "Likes"),
                    m('th', {
                        "style":"width:15vw"
                    }),
                ]),
                vnode.attrs.profile.userData.posts.map(function(item) {
                    if (vnode.attrs.owned) {
                        return m("tr", [
                            m('td', {
                                "style":"width:40vw"
                            }, m('img', {
                                    class:"profile_image",
                                    'src': item.properties.url
                                })
                            ),
                            m('td', {
                                "style":"width:30vw"
                            }, m('label', item.properties.body)
                            ),
                            m('td', {
                                "style":"width:5vw"
                            },
                                m('label',
                                    item.properties.likes
                                )
                            ),
                            m("td", {
                                "style":"width:10vw"
                            },
                                    m("button", {
                                        "class":"btn btn-success",
                                        onclick: function () {
                                            MyApp.PostView.likePost(item.key.name);
                                        },
                                },
                                "Like your own post (weird)")
                            ),
                            m("td", {
                                "style":"width:10vw"
                            },
	                            m("button", {
	                                  "class":"btn btn-danger",
	                                  onclick: function() {
                                          MyApp.PostView.deletePost(item);
	                                   },

	                            	},
	                            "Delete this post")
                            )
                        ]);
                    } else {
                        return m("tr", [
                            m('td', {
                                "style":"width:50vw"
                            }, m('img', {
                                    class:"profile_image",
                                    'src': item.properties.url
                                })
                            ),
                            m('td', {
                                "style":"width:30vw"
                            }, m('label', item.properties.body)
                            ),
                            m('td', {
                                "style":"width:5vw"
                            },
                                m('label',
                                    item.properties.likes
                                )
                            ),
                            m("td", {
                                "style":"width:15vw"
                            },
                                    m("button", {
                                        "class":"btn btn-success float-right",
                                        onclick: function () {
                                            MyApp.PostView.likePost(item.key.name);
                                        },
                                },
                                "Like this post")
                            ),
                        ]);
                    }
                })
            ]),
            m('button',{
                class: 'btn btn-info float-right mt-3',
                onclick: function(e) {
                    vnode.attrs.profile.getNextPosts();
                }
            }, "Next"),
        ]);
    },
    deletePost: function (post) {
        var data = {
            'id': post.key.name,
            'access_token': encodeURIComponent(MyApp.Profile.userData.id)
        };
        m.request ({
            method: "POST",
            url: "_ah/api/post_api/1.0/deletePost",
            params: data,
        }).then(function(response) {
            console.log(post.key.name + " deleted");
            MyApp.Profile.getPosts();
            m.redraw();
        });

    },
	likePost: function(postLiked) {
	    var data = {
            'postLiked': postLiked,
            'email': MyApp.Profile.userData.email,
            'access_token': encodeURIComponent(MyApp.Profile.userData.id)
        };
	    m.request ({
	 		method: "POST",
            url: "_ah/api/like_api/1.0/newLike",
            params: data,
		}).then(function() {
            console.log(postLiked + " liked");
            MyApp.Profile.getPosts();
            m.redraw();
        });
	}
};

MyApp.Login = {
    view: function() {
        return m('div',[
            m(MyApp.Navbar),
            m('div.container',[
                m("h1.title", 'Please Sign in with google to use the application.'),
                m("h2", 'If no sign in button appears on the top left of the screen, please refresh the page.'),
            ])
        ]);
    }
};

MyApp.Admin = {
    view: function() {
        return m('div',[
            m(MyApp.Navbar),
            m('div.container',[
                m("button.btn.btn-success", {
                    onclick : function () {
                        MyApp.Profile.userData.firstName = MyApp.Admin.makeRandomName("firstName");
                        MyApp.Profile.userData.lastName = MyApp.Admin.makeRandomName("lastName");
                        MyApp.Profile.userData.name = MyApp.Profile.userData.firstName+" "+MyApp.Profile.userData.lastName;
                        MyApp.Profile.userData.email = MyApp.Profile.userData.firstName+"."+MyApp.Profile.userData.lastName+"@gmail.com";
                        MyApp.Profile.userData.url = "https://dummyimage.com/320x200/000/fff&text="+Date.now();

                        console.log(MyApp.Profile.userData);

                        MyApp.Profile.createUser();
                    }
                }, "Add random user")
            ])
        ]);
    },
    makeRandomName: function (type) {
        var firstNameArray = ["Adam", "Alex", "Aaron", "Ben", "Carl", "Dan", "David", "Edward", "Fred", "Frank", "George", "Hal", "Hank", "Ike", "John", "Jack", "Joe", "Larry", "Monte", "Matthew", "Mark", "Nathan", "Otto", "Paul", "Peter", "Roger", "Roger", "Steve", "Thomas", "Tim", "Ty", "Victor", "Walter"];
        var lastNameArray = ["Anderson", "Ashwoon", "Aikin", "Bateman", "Bongard", "Bowers", "Boyd", "Cannon", "Cast", "Deitz", "Dewalt", "Ebner", "Frick", "Hancock", "Haworth", "Hesch", "Hoffman", "Kassing", "Knutson", "Lawless", "Lawicki", "Mccord", "McCormack", "Miller", "Myers", "Nugent", "Ortiz", "Orwig", "Ory", "Paiser", "Pak", "Pettigrew", "Quinn", "Quizoz", "Ramachandran", "Resnick", "Sagar", "Schickowski", "Schiebel", "Sellon", "Severson", "Shaffer", "Solberg", "Soloman", "Sonderling", "Soukup", "Soulis", "Stahl", "Sweeney", "Tandy", "Trebil", "Trusela", "Trussel", "Turco", "Uddin", "Uflan", "Ulrich", "Upson", "Vader", "Vail", "Valente", "Van Zandt", "Vanderpoel", "Ventotla", "Vogal", "Wagle", "Wagner", "Wakefield", "Weinstein", "Weiss", "Woo", "Yang", "Yates", "Yocum", "Zeaser", "Zeller", "Ziegler", "Bauer", "Baxster", "Casal", "Cataldi", "Caswell", "Celedon", "Chambers", "Chapman", "Christensen", "Darnell", "Davidson", "Davis", "DeLorenzo", "Dinkins", "Doran", "Dugelman", "Dugan", "Duffman", "Eastman", "Ferro", "Ferry", "Fletcher", "Fietzer", "Hylan", "Hydinger", "Illingsworth", "Ingram", "Irwin", "Jagtap", "Jenson", "Johnson", "Johnsen", "Jones", "Jurgenson", "Kalleg", "Kaskel", "Keller", "Leisinger", "LePage", "Lewis", "Linde", "Lulloff", "Maki", "Martin", "McGinnis", "Mills", "Moody", "Moore", "Napier", "Nelson", "Norquist", "Nuttle", "Olson", "Ostrander", "Reamer", "Reardon", "Reyes", "Rice", "Ripka", "Roberts", "Rogers", "Root", "Sandstrom", "Sawyer", "Schlicht", "Schmitt", "Schwager", "Schutz", "Schuster", "Tapia", "Thompson", "Tiernan", "Tisler" ];

        if (type=="firstName") {
            return firstNameArray[Math.floor(Math.random()*firstNameArray.length)];
        } else {
            return lastNameArray[Math.floor(Math.random()*firstNameArray.length)];
        }
    }
};