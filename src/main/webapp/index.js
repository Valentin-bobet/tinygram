m.route(document.body, "/", {
    "/" : {
        onmatch: function() {
            return Navbar
        }
    },
    "/profile": {
        onmatch: function() {
            if (!auth2.isSignedIn.get()) m.route.set("/login");
            else return Profile;
        }
    },
    "/login": {
        onmatch: function () {
            return Login;
        }
    }
})

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
            Profile.name = googleUser.getBasicProfile().getName();
            Profile.email = googleUser.getBasicProfile().getEmail();
            Profile.id = googleUser.getAuthResponse().id_token;
            Profile.url = googleUser.getBasicProfile().getImageUrl();

        } else {
            Profile.name = "";
            Profile.email = "";
            Profile.id = "";
            Profile.url = "";
        }
    }
};

var onSuccess = function(user) {
    googleUser = user;
    var profile = user.getBasicProfile();

    Profile.name = profile.getName();
    Profile.email = profile.getEmail();
    Profile.id = user.getAuthResponse().id_token;
    Profile.url = profile.getImageUrl();

    console.log(Profile);
    isLoggedIn=true;

    Profile.tinyUser();
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

var signInButton = {
    view: function () {
        return m("div", {
                "class":"g-signin2",
                "id":"signin-button"
            }
        );
    }
}


var profilPicAndSignOut = {
    view: function () {
        if(Profile.id!="") {
            return m("div.form-inline.my-2.my-lg-0", [
                m("span[aria-controls='collapseSignOut'][aria-expanded='false'][data-target='#collapseSignOut'][data-toggle='collapse']",
                    m("img.mr-sm-2", {
                        class:"profile_image",
                        "style":"height:42px",
                        "src":Profile.url,
                        "alt":Profile.name,
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

var searchBar = {
    view: function () {
        if(Profile.id!="") {
            return m("div.form-inline", [
                m("div",
                    m("form.form-inline.my-2.my-lg-0[action='/search'][method='post']", [
                        m("input.form-control.mr-sm-2[aria-label='Search'][id='search'][name='search'][placeholder='Search users'][type='search']"),
                        m("input[id='me'][name='me'][type='hidden'][value=" + Profile.email + "]"),
                        m("button.btn.btn-outline-success.my-2.my-sm-0.mr-2[type='submit']", "Search"),
                    ]),
                ),
                m(profilPicAndSignOut)
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

var Navbar = {
    view: function () {
        return (m("nav.navbar.navbar-expand-lg.navbar-light.mb-5", [
            m(".collapse.navbar-collapse[id='navbarSupportedContent']", [
                m("ul.navbar-nav.mr-auto", [
                    m("li.nav-item mr-5", [
                        m(signInButton),
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
                m(searchBar)
            ])
        ]));
    },

}

var Profile = {
    name: "",
    email: "",
    id: "",
    url: "",
    content:"",
    nextToken:"",
    list:[],
    view: function(){
        return m('div',[
            m(Navbar),
            m('div', {class:'container'},[
                m('div', {class:"row"},[
                    m('div', {class:"col-md-2 col-sm-2 col-xs-2"},
                        m("img", {
                            class:"profile_image",
                            "src":Profile.url
                        })
                    ),
                    m('div', {class:"col-md-8 col-sm-8 col-xs-8"},
                        m("h1", {
                            class: 'title'
                        }, Profile.name),
                        m("h2", {
                            class: 'subtitle'
                        }, Profile.email)
                    ),
                    m('div', {class:"col-md-2 col-sm-2 col-xs-2"},
                        m("button", {
                            class:"btn btn-info float-right",
                            onclick: function () {
                                Profile.loadList();
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
                            Profile.postMessage()
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
                                            Profile.url = e.target.value
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
                                            Profile.content = e.target.value
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
                            Profile.postMessage()
                        },
                    },"Post Random Message"),
                ]),
                m("div",m(PostView,{profile: Profile}))
            ])
        ])
    },
    loadList: function() {
        return m.request({
            method: "GET",
            url: "_ah/api/myApi/v1/collectionresponse_entity"+'?access_token=' + encodeURIComponent(Profile.id)
        })
        .then(function(result) {
            console.log("load_list:",result)
            Profile.list=result.items
            if ('nextPageToken' in result) {
                    Profile.nextToken= result.nextPageToken
            } else {
                Profile.nextToken=""
            }
        })
    },
    next: function() {
        return m.request({
            method: "GET",
            url: "_ah/api/myApi/v1/collectionresponse_entity",
            params: {
                'next':Profile.nextToken,
                'access_token': encodeURIComponent(Profile.id)
            }
        })
        .then(function(result) {
            console.log("next:",result)
            result.items.map(function(item){Profile.list.push(item)})
            if ('nextPageToken' in result) {
                    Profile.nextToken= result.nextPageToken
            } else {
                Profile.nextToken=""
            }
        })
    },
    postMessage: function() {
        var data={'url': "https://dummyimage.com/320x200/000/fff&text="+Date.now(),
                'body': Profile.content}
        console.log("post:"+data)
        return m.request({
            method: "POST",
            url: "_ah/api/myApi/v1/postMsg"+'?access_token='+encodeURIComponent(Profile.id),
            params: data,
        })
        .then(function(result) {
            console.log("post_message:",result)
            Profile.loadList()
        })
    },
    tinyUser: function() {
        var data = {'email': Profile.email};
        return m.request ({
            method: "POST",
            url: "_ah/api/myApi/v1/tinyUser"+'?access_token='+encodeURIComponent(Profile.id),
            params: data,
        })
    },
	likeIt: function(postLiked) {
	    var data = {'postLiked': postLiked,
	    			'mail': Profile.email};

	    return m.request ({
	 		method: "POST",
	 		url: "_ah/api/myApi/v1/likeIt"+'?access_token='+encodeURIComponent(Profile.id),
	 		params: data,
		})
	}
}

var PostView = {
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

var Login = {
    view: function() {
        return m('div',[
            m(Navbar),
            m('div.container',[
                m("h1.title", 'Please Sign in with google to use the application.'),
                m("h2", 'If no sign in button appears on the top left of the screen, please refresh the page.'),
            ])
        ])
    }
}