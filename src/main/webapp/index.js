
m.route(document.body, "/", {
    "/" : {
        onmatch: function() {
            return Navbar
        }
    },
    "/profile": {
        onmatch: function() {
            if (!auth2.isSignedIn.get() || sessionStorage.getItem("Profile") === null) m.route.set("/login");
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
var googleUser = {}; // The current user

gapi.load('auth2', function(){
    auth2 = gapi.auth2.init({
        client_id: '834229904246-7e02hoftjchsgnkh2a1be93ao1u7ip4o.apps.googleusercontent.com'
    });
    auth2.attachClickHandler('signin-button', {}, onSuccess, onFailure);

    auth2.isSignedIn.listen(signinChanged);
    auth2.currentUser.listen(userChanged); // This is what you use to listen for user changes
});

var signinChanged = function (val) {
    isLoggedIn = val;
    console.log('Signin state changed to ', val);
};

var onSuccess = function(user) {
    googleUser = user;
    var profile = user.getBasicProfile();

    Profile.name = profile.getName();
    Profile.email = profile.getEmail();
    Profile.id = user.getAuthResponse().id_token;
    Profile.url = profile.getImageUrl();

    console.log(Profile);
    sessionStorage.setItem("Profile",Profile);
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
    });
}

var userChanged = function (user) {
    if(user.getId()){
      // Do something here
    }
};

function onSignIn(googleUser) {
  }


/*var signInButton = {
    view: function () {
        return m("div", {
            "class":"g-signin2",
            "id":"signin-button",
            "data-onsuccess": "console.log("});
    }
}

var signOutButton = {
    view: function () {
        return m("button",{class:"btn", id:"signin-button", onclick: function(e) { signOut() }},"Sign out");
    }

}*/

var signInButton = {
    view: function () {
        if(isLoggedIn || sessionStorage.getItem("Profile") != null) {
            return m("div", [
                    m("img", {
                        class:"profile_image",
                        "src":Profile.url,
                        "alt":Profile.name,
                    }),
                    m("div", {
                        "class":"g-signin2",
                        "style":"display:none",
                        "id":"signin-button",
                        "data-onsuccess": console.log("Glogin ready")
                    })
                ]);
        } else {
            return m("div", {
                "class":"g-signin2",
                "id":"signin-button",
                "data-onsuccess": console.log("Glogin ready")});
        }
    }
}

var searchBar = {
    view: function () {
        if(isLoggedIn  || sessionStorage.getItem("Profile") != null) {
            return (
                m("form.form-inline.my-2.my-lg-0[action='/search'][method='post']", [
                    m("input.form-control.mr-sm-2[aria-label='Search'][id='search'][name='search'][placeholder='Search users'][type='search']"),
                    m("button.btn.btn-outline-success.my-2.my-sm-0[type='submit']", "Search")
                ])
            );
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
        return (m("nav.navbar.navbar-expand-lg.navbar-light", [
            m(".collapse.navbar-collapse[id='navbarSupportedContent']", [
                m("ul.navbar-nav.mr-auto", [
                    m("li.nav-item mr-5", [
                        m(signInButton),
                    ]),
                    m("li.nav-item", [
                        m("a.nav-link[href='#']", ["Home ",m("span.sr-only", "(current)")])
                    ]),
                    m("li.nav-item", [
                        m(m.route.Link, {href: "/profile", oncreate: m.route.link, onupdate: m.route.link, class:"nav-link"}, "My Profile")
                    ])
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
                m("h1", {
                    class: 'title'
                }, Profile.name),
                m("h2", {
                    class: 'subtitle'
                }, Profile.email),
                m("img", {
                    class:"profile_image",
                    "src":Profile.url
                }),
                m("button", {
                    class:"button",
                    onclick: function () {
                        Profile.loadList();
                    },
                },"Msgs"),
                m("p",{class: 'my-5'}, [
                    m("button.btn[aria-controls='collapseNewPost'][aria-expanded='false'][data-target='#collapseNewPost'][data-toggle='collapse'][type='button']", "Make a new Post"),
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
                    m("br"),
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
                m("h1.title", 'Please Sign in with google to use the application')
            ])
        ])
    }
}