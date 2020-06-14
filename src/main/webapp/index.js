m.route(document.body, "/", {
    "/" : {
        onmatch: function() {
            return MyApp;
        }
    },
    "/profile": {
        onmatch: function() {
            if (!auth2.isSignedIn.get()) m.route.set("/login");
            else return MyApp.Profile;
        }
    },
    "/search": {
        onmatch : function () {
            return MyApp.SearchedUsersList;
        }
    },
    "/login": {
        onmatch: function () {
            return MyApp.Login;
        }
    }
})

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
        console.log('Signin state changed to ', loggedIn);
        if(loggedIn) {
            MyApp.Profile.name = googleUser.getBasicProfile().getName();
            MyApp.Profile.email = googleUser.getBasicProfile().getEmail();
            MyApp.Profile.firstName = googleUser.getBasicProfile().getGivenName();
            MyApp.Profile.lastName= googleUser.getBasicProfile().getFamilyName();
            MyApp.Profile.id = googleUser.getAuthResponse().id_token;
            MyApp.Profile.url = googleUser.getBasicProfile().getImageUrl();

        } else {
            MyApp.Profile.name = "";
            MyApp.Profile.firstName = "";
            MyApp.Profile.lastName = "";
            MyApp.Profile.email = "";
            MyApp.Profile.id = "";
            MyApp.Profile.url = "";
        }
    }
};

var onSuccess = function(user) {
    googleUser = user;
    var profile = user.getBasicProfile();

    MyApp.Profile.name = profile.getName();
    MyApp.Profile.firstName = profile.getGivenName();
    MyApp.Profile.lastName= profile.getFamilyName();
    MyApp.Profile.email = profile.getEmail();
    MyApp.Profile.id = user.getAuthResponse().id_token;
    MyApp.Profile.url = profile.getImageUrl();

    console.log(MyApp.Profile);
    isLoggedIn=true;

    MyApp.Profile.tinyUser();
    m.route.set("/");
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
        )
    }
}

MyApp.Navbar = {
    view: function () {
        return (m("nav.navbar.navbar-expand-lg.navbar-light.mb-5", [
            m(".collapse.navbar-collapse[id='navbarSupportedContent']", [
                m("ul.navbar-nav.mr-auto", [
                    m("li.nav-item mr-5", [
                        m(MyApp.signInButton),
                    ]),
                    m("li.nav-item",
                        m("h2",
                            m("a.nav-link[href='#']", ["Home ",m("span.sr-only", "(current)")])
                        )
                    ),
                    m("li.nav-item",
                        m("h2",
                            m(m.route.Link, {href: "/profile", oncreate: m.route.link, onupdate: m.route.link, class:"nav-link"}, "My Profile")
                        )
                    )
                ]),
                m(MyApp.searchBar)
            ])
        ]));
    },

}

MyApp.signInButton = {
    view: function () {
        return m("div", {
                "class":"g-signin2",
                "id":"signin-button"
            }
        );
    }
}

MyApp.searchBar = {
    view: function () {
        if(MyApp.Profile.id!="") {
            return m("div.form-inline", [
                m("div",
                    m("form.form-inline.my-2.my-lg-0[action='/search'][method='post']", {
                        id:"searchForm"
                    }, [
                        m("input.form-control.mr-sm-2[aria-label='Search'][id='search'][name='search'][placeholder='Search users'][type='search']"),
                        m("input[id='me'][name='me'][type='hidden'][value=" + MyApp.Profile.email + "]"),
                        m("button.btn.btn-outline-success.my-2.my-sm-0.mr-2[type='submit']",{
                            onclick: function (e) {
                                e.preventDefault();
                                $.ajax({
                                    type: 'POST',
                                    url: $("#searchForm").attr('action'),
                                    data: $("#searchForm").serialize()
                                }).done(function (response) {
                                    showSearchList = true;
                                    var i = 0;
                                    response.tinyUser.forEach(tinyUser => {
                                        MyApp.SearchedUsersList.tinyUser[i] = {
                                            email:tinyUser.email,
                                            name:tinyUser.name,
                                            invertedName:tinyUser.invertedName,
                                            firstName:tinyUser.firstName,
                                            lastName:tinyUser.lastName,
                                            url:tinyUser.url,
                                            friend:tinyUser.friend,
                                        }
                                    });
                                    m.route.set("/search");
                                })
                            }
                        } , "Search"),
                    ]),
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
    }
}

MyApp.profilePicAndSignOut = {
    view: function () {
        if(MyApp.Profile.id!="") {
            return m("div.form-inline.my-2.my-lg-0", [
                m("span[aria-controls='collapseSignOut'][aria-expanded='false'][data-target='#collapseSignOut'][data-toggle='collapse']",
                    m("img.mr-sm-2", {
                        class:"profile_image",
                        "style":"height:42px",
                        "src":MyApp.Profile.url,
                        "alt":MyApp.Profile.name,
                    }),
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
}

MyApp.SearchedUsersList = {
    tinyUser: [],
    view: function (vnode) {
        return (
            m("div", [
                m(MyApp.Navbar),
                m("div.container", [
                    m('table', {
                        class:'table is-striped',
                        "table":"is-striped"
                    },[
                        MyApp.SearchedUsersList.tinyUser.map(function(tinyUser) {
                            return m("tr", {
                                "style":"height:9vh"
                            }, [
                                m('td', {
                                    "style":"width:10vw"
                                },  m('img',
                                    {
                                        "style":"height:8vh",
                                        class:"profile_image",
                                        'src': tinyUser.url,
                                        'alt':tinyUser.name,
                                    })
                                ),
                                m('td.inline', {
                                    "style":"width:80vw"
                                }, [
                                    m('h1', tinyUser.name),
                                    m('span', "("+tinyUser.email+")"),

                                ]),
                                m('td', {
                                    "style":"width:12vw"
                                }, m('button.btn.float-right', {
                                    class:tinyUser.friend?"btn-danger":"btn-success",
                                    onclick: function () {
                                        tinyUser.friend?console.log("Unfollowed"):console.log("Followed");
                                    }
                                }, tinyUser.friend?"Unfollow":"Follow")
                                ),
                            ])
                        })
                    ])
                ])
            ])
        )
    }
}

MyApp.Timeline = {
    view: function () {
        return m("span","this is the timeline");
    }
}

MyApp.Profile = {
    name: "",
    firstName: "",
    lastName: "",
    email: "",
    id: "",
    url: "",
    content:"",
    nextToken:"",
    list:[],
    view: function(){
        return m('div',[
            m(MyApp.Navbar),
            m('div', {class:'container'},[
                m('div', {class:"row"},[
                    m('div', {class:"col-md-2 col-sm-2 col-xs-2"},
                        m("img", {
                            class:"profile_image",
                            "src":MyApp.Profile.url
                        })
                    ),
                    m('div', {class:"col-md-8 col-sm-8 col-xs-8"},
                        m("h1", {
                            class: 'title'
                        }, MyApp.Profile.name),
                        m("h2", {
                            class: 'subtitle'
                        }, MyApp.Profile.email)
                    ),
                    m('div', {class:"col-md-2 col-sm-2 col-xs-2"},
                        m("button", {
                            class:"btn btn-info float-right",
                            onclick: function () {
                                MyApp.Profile.loadList();
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
                            e.preventDefault()
                            if (url="") {url="https://dummyimage.com/320x200/000/fff&text="+Date.now()}
                            if (body="") {body="bla bla bla \n"+Date.now()}
                            MyApp.Profile.postMessage()
                        }},
                        [
                            m('div', {
                                class:'field'
                            },[
                                m("label", {class:'label'},"URL"),
                                m('div',{class:'control'},
                                    m("input[type=text]", {
                                        class:'input is-rounded',
                                        placeholder:"Your url",
                                        oninput: function(e) {
                                            MyApp.Profile.url = e.target.value
                                        }
                                    })
                                ),
                            ]),
                            m('div',{class:'field'},[
                                m("label", {class: 'label'},"Body"),
                                m('div',{class:'control'},
                                    m("input[type=textarea]", {
                                        class:'textarea',
                                        placeholder:"your text",
                                        oninput: function(e) {
                                            MyApp.Profile.content = e.target.value
                                        }
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
                            MyApp.Profile.postMessage()
                        },
                    },"Post Random Message"),
                ]),
                m("div",m(MyApp.PostView,{profile: MyApp.Profile}))
            ])
        ])
    },
    loadList: function() {
        return m.request({
            method: "GET",
            url: "_ah/api/myApi/v1/collectionresponse_entity"+'?access_token=' + encodeURIComponent(MyApp.Profile.id)
        })
        .then(function(result) {
            console.log("load_list:",result)
            MyApp.Profile.list=result.items
            if ('nextPageToken' in result) {
                MyApp.Profile.nextToken= result.nextPageToken
            } else {
                MyApp.Profile.nextToken=""
            }
        })
    },
    next: function() {
        return m.request({
            method: "GET",
            url: "_ah/api/myApi/v1/collectionresponse_entity",
            params: {
                'next':MyApp.Profile.nextToken,
                'access_token': encodeURIComponent(MyApp.Profile.id)
            }
        })
        .then(function(result) {
            console.log("next:",result)
            result.items.map(function(item){MyApp.Profile.list.push(item)})
            if ('nextPageToken' in result) {
                MyApp.Profile.nextToken= result.nextPageToken
            } else {
                MyApp.Profile.nextToken=""
            }
        })
    },
    postMessage: function() {
        var data={'url': "https://dummyimage.com/320x200/000/fff&text="+Date.now(),
                'body': MyApp.Profile.content}
        console.log("post:"+data)
        return m.request({
            method: "POST",
            url: "_ah/api/myApi/v1/postMsg"+'?access_token='+encodeURIComponent(MyApp.Profile.id),
            params: data,
        })
        .then(function(result) {
            console.log("post_message:",result)
            MyApp.Profile.loadList()
        })
    },
    tinyUser: function() {
        var data = {
            'email': MyApp.Profile.email,
            'firstName': MyApp.Profile.firstName,
            'lastName': MyApp.Profile.lastName,
            'name': MyApp.Profile.name,
            'invertedName': MyApp.Profile.lastName + " " + MyApp.Profile.firstName,
            'url': MyApp.Profile.url,
        };
        return m.request ({
            method: "POST",
            url: "_ah/api/myApi/v1/tinyUser"+'?access_token='+encodeURIComponent(MyApp.Profile.id),
            params: data,
        })
    },
	likeIt: function(postLiked) {
	    var data = {
            'postLiked': postLiked,
            'mail': MyApp.Profile.email
        };

	    return m.request ({
	 		method: "POST",
	 		url: "_ah/api/myApi/v1/likeIt"+'?access_token='+encodeURIComponent(MyApp.Profile.id),
	 		params: data,
		})
	}
}

MyApp.PostView = {
    view: function(vnode) {
        return m('div', [
            m('div',{class:'subtitle'},"My Posts"),
            m('table', {
                class:'table is-striped',"table":"is-striped"
            },[
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
                ]),
                vnode.attrs.profile.list.map(function(item) {
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
                            item.properties.likec
                        )
                    ),
                    m("td", {
                        "style":"width:10vw"
                    },
                            m("button", {
                                "class":"btn btn-success",
                                onclick: function () {
                                	Profile.likeIt(item.key.name);
                                    console.log("like:"+item.key.id)
                                },
                        },
                        "Like your own post (weird)")
                    ),
                    m("td", {
                        "style":"width:10vw"
                    }, m("button", {
                            "class":"btn btn-danger",
                            onclick: function(e) {
                                console.log("del:"+item.key.id)
                            }
                        },
                    "Delete this post")),
                ])
                })
            ]),
            m('button',{
                class: 'btn btn-info float-right mt-3',
                onclick: function(e) {
                    vnode.attrs.profile.next()
                }
            }, "Next"),
        ])
    }
}

MyApp.Login = {
    view: function() {
        return m('div',[
            m(MyApp.Navbar),
            m('div.container',[
                m("h1.title", 'Please Sign in with google to use the application.'),
                m("h2", 'If no sign in button appears on the top left of the screen, please refresh the page.'),
            ])
        ])
    }
}