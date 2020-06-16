package foo;

import java.io.Console;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Random;
import java.util.Arrays;

import com.google.api.server.spi.auth.common.User;
import com.google.api.server.spi.config.Api;
import com.google.api.server.spi.config.ApiMethod;
import com.google.api.server.spi.config.ApiMethod.HttpMethod;
import com.google.api.server.spi.config.ApiNamespace;
import com.google.api.server.spi.config.Named;
import com.google.api.server.spi.config.Nullable;
import com.google.api.server.spi.response.CollectionResponse;
import com.google.api.server.spi.response.UnauthorizedException;
import com.google.api.server.spi.auth.EspAuthenticator;

import com.google.appengine.api.datastore.Cursor;
import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.EntityNotFoundException;
import com.google.appengine.api.datastore.FetchOptions;
import com.google.appengine.api.datastore.Key;
import com.google.appengine.api.datastore.KeyFactory;
import com.google.appengine.api.datastore.Query;
import com.google.appengine.api.datastore.PreparedQuery;
import com.google.appengine.api.datastore.PropertyProjection;
import com.google.appengine.api.datastore.PreparedQuery.TooManyResultsException;
import com.google.appengine.api.datastore.Query.CompositeFilter;
import com.google.appengine.api.datastore.Query.CompositeFilterOperator;
import com.google.appengine.api.datastore.Query.Filter;
import com.google.appengine.api.datastore.Query.FilterOperator;
import com.google.appengine.api.datastore.Query.FilterPredicate;
import com.google.appengine.api.datastore.Query.SortDirection;
import com.google.appengine.api.datastore.QueryResultList;
import com.google.appengine.api.datastore.Transaction;
import com.google.appengine.repackaged.com.google.common.io.CountingOutputStream;
import com.google.appengine.repackaged.com.google.protobuf.Empty;
import com.google.appengine.repackaged.com.google.protobuf.proto1api.ListValue;


@Api(name = "myApi",
     version = "v1",
     audiences = "870442540848-fop7dnthuie202lpqh38os9i9n4phgv3.apps.googleusercontent.com",
  	 clientIds = "870442540848-fop7dnthuie202lpqh38os9i9n4phgv3.apps.googleusercontent.com",
     namespace =
     @ApiNamespace(
		   ownerDomain = "simple-basique-basique-simple.appspot.com",
		   ownerName = "simple-basique-basique-simple.appspot.com",
		   packagePath = "")
     )

public class ScoreEndpoint {

	@ApiMethod(name = "postMessage", httpMethod = HttpMethod.POST)
	public Entity postMessage(PostMessage pm) {
		
		Entity e = new Entity("Post"); // quelle est la clef ?? non specifié -> clef automatique
		e.setProperty("owner", pm.owner);
		e.setProperty("url", pm.url);
		e.setProperty("body", pm.body);
		e.setProperty("likes", 0);
		e.setProperty("date", new Date());

		DatastoreService datastore_2 = DatastoreServiceFactory.getDatastoreService();
		Transaction txn = datastore_2.beginTransaction();
		datastore_2.put(e);
		txn.commit();
		return e;
	}

	@ApiMethod(name = "mypost", httpMethod = HttpMethod.GET)
	public CollectionResponse<Entity> mypost(@Named("name") String name, @Nullable @Named("next") String cursorString) {

	    Query q = new Query("Post").setFilter(new FilterPredicate("owner", FilterOperator.EQUAL, name));

	    // https://cloud.google.com/appengine/docs/standard/python/datastore/projectionqueries#Indexes_for_projections
	    //q.addProjection(new PropertyProjection("body", String.class));
	    //q.addProjection(new PropertyProjection("date", java.util.Date.class));
	    //q.addProjection(new PropertyProjection("likes", Integer.class));
	    //q.addProjection(new PropertyProjection("url", String.class));

	    // looks like a good idea but...
	    // generate a DataStoreNeedIndexException ->
	    // require compositeIndex on owner + date
	    // Explosion combinatoire.
	    // q.addSort("date", SortDirection.DESCENDING);

	    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
	    PreparedQuery pq = datastore.prepare(q);

	    FetchOptions fetchOptions = FetchOptions.Builder.withLimit(2);

	    if (cursorString != null) {
		fetchOptions.startCursor(Cursor.fromWebSafeString(cursorString));
		}

	    QueryResultList<Entity> results = pq.asQueryResultList(fetchOptions);
	    cursorString = results.getCursor().toWebSafeString();

	    return CollectionResponse.<Entity>builder().setItems(results).setNextPageToken(cursorString).build();

	}

	@ApiMethod(name = "getPost",httpMethod = ApiMethod.HttpMethod.GET)
	public CollectionResponse<Entity> getPost(User user, @Nullable @Named("next") String cursorString)
			throws UnauthorizedException {

		if (user == null) {
			throw new UnauthorizedException("Invalid credentials");
		}

		Query q = new Query("Post").setFilter(new FilterPredicate("owner", FilterOperator.EQUAL, user.getEmail()));

		DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
		PreparedQuery pq = datastore.prepare(q);

		FetchOptions fetchOptions = FetchOptions.Builder.withLimit(2);

		if (cursorString != null) {
			fetchOptions.startCursor(Cursor.fromWebSafeString(cursorString));
		}

		QueryResultList<Entity> results = pq.asQueryResultList(fetchOptions);
		cursorString = results.getCursor().toWebSafeString();

		return CollectionResponse.<Entity>builder().setItems(results).setNextPageToken(cursorString).build();
	}

	@ApiMethod(name = "postMsg", httpMethod = HttpMethod.POST)
	public Entity postMsg(User user, PostMessage pm) throws UnauthorizedException {

		if (user == null) {
			throw new UnauthorizedException("Invalid credentials");
		}
		DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
		
		Query q = new Query("tinyUser").setFilter(new FilterPredicate("email", FilterOperator.EQUAL, user.getEmail()));
		PreparedQuery pq = datastore.prepare(q);
		Entity searchQueryResult = pq.asSingleEntity();
		
		List<String> recievers = new ArrayList<>();
		recievers = (List<String>)searchQueryResult.getProperty("followers");

		Entity e = new Entity("Post", Long.MAX_VALUE-(new Date()).getTime()+":"+user.getEmail());
		e.setProperty("owner", user.getEmail());
		e.setProperty("url", pm.url);
		e.setProperty("body", pm.body);
		e.setProperty("likes", 0);
		e.setProperty("date", new Date());
		e.setProperty("recievers", recievers);

///		Solution pour pas projeter les listes
//		Entity pi = new Entity("PostIndex", e.getKey());
//		HashSet<String> rec=new HashSet<String>();
//		pi.setProperty("receivers",rec);

		DatastoreService datastore_2 = DatastoreServiceFactory.getDatastoreService();
		Transaction txn = datastore_2.beginTransaction();
		datastore_2.put(e);
//		datastore.put(pi);
		txn.commit();
		return e;
	}

	@ApiMethod(name= "tinyUser", httpMethod = HttpMethod.POST)
	public Entity tinyUser(User user, TinyUser tinyUser) throws UnauthorizedException {

		if (user == null) {
			throw new UnauthorizedException("Invalid credentials");
		}

		DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();

	    Query searchQuery = new Query("tinyUser").setFilter(
	    		new FilterPredicate("email", FilterOperator.EQUAL, tinyUser.email));

	    PreparedQuery preparedSearchQuery = datastore.prepare(searchQuery);

		List<Entity> searchQueryResult = preparedSearchQuery.asList(FetchOptions.Builder.withDefaults());

		if(searchQueryResult.isEmpty()) {
			Entity e = new Entity("tinyUser");
			e.setProperty("email", tinyUser.email);
			e.setProperty("name", tinyUser.name);
			e.setProperty("invertedName", tinyUser.invertedName);
			e.setProperty("firstName", tinyUser.firstName);
			e.setProperty("lastName", tinyUser.lastName);
			e.setProperty("url", tinyUser.url);
			List<String> followers = new ArrayList<>();
			followers.add(user.getEmail());
			e.setProperty("followers", followers);

			DatastoreService datastore_2 = DatastoreServiceFactory.getDatastoreService();
			Transaction txn = datastore_2.beginTransaction();
			datastore_2.put(e);
			txn.commit();
			return e;
		}
		return null;
	}

	@ApiMethod(name= "likeIt", httpMethod = HttpMethod.POST)
	public Entity likeIt(User u, Like like) throws UnauthorizedException {

		if (u.getEmail() == null) {
			throw new UnauthorizedException("Invalid credentials");
		}

		DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();

	    Query searchQuery = new Query("Like").setFilter(CompositeFilterOperator.and(
	    		new FilterPredicate("Email", FilterOperator.EQUAL, u.getEmail()),
	    		new FilterPredicate("Post", FilterOperator.EQUAL, like.getPostLiked())));

	    PreparedQuery preparedSearchQuery = datastore.prepare(searchQuery);

		List<Entity> searchQueryResult = preparedSearchQuery.asList(FetchOptions.Builder.withDefaults());

		if(searchQueryResult.isEmpty()) {
			Entity e = new Entity("Like");
			e.setProperty("Email", u.getEmail());
			e.setProperty("Post", like.getPostLiked());

			DatastoreService datastore_2 = DatastoreServiceFactory.getDatastoreService();
			Transaction txn = datastore_2.beginTransaction();
			datastore_2.put(e);
			txn.commit();
			
			try {
				this.countLike(u, like);
			} catch (UnauthorizedException e1) {
				// TODO Auto-generated catch block
				e1.printStackTrace();
			} catch (EntityNotFoundException e1) {
				// TODO Auto-generated catch block
				e1.printStackTrace();
			}
			
			return e;
		}
		return null;
	}


	@ApiMethod(name= "Frienship", httpMethod = HttpMethod.POST)
	public Entity Friendship(User u,Friendship tu) throws UnauthorizedException, EntityNotFoundException {

		if (u == null) {
			throw new UnauthorizedException("Invalid credentials");
		}

	    Query searchQuery = new Query("tinyUser").setFilter(new FilterPredicate("email", FilterOperator.EQUAL, tu.getTargetUser()));
	    
	    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
	    
	    PreparedQuery preparedSearchQuery = datastore.prepare(searchQuery);

		Entity e = preparedSearchQuery.asSingleEntity();
		
		List<String> followers = new ArrayList<>();
		followers = (List<String>)e.getProperty("followers");				
		
		followers.add(u.getEmail());
		
		e.setProperty("followers", followers);
				
		Transaction txn = datastore.beginTransaction();
		datastore.put(e);
		txn.commit();
		return e;

	}

	@ApiMethod(name= "countLike", httpMethod = HttpMethod.POST)
	public Entity countLike(User u, Like like) throws UnauthorizedException, EntityNotFoundException {
		
		DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();

		Key clePost = KeyFactory.createKey("Post", like.getPostLiked());
		
		Entity lePost = datastore.get(clePost);

		Entity e = new Entity("Post");
		
		e.setProperty("likes", (Long) lePost.getProperty("likes") + 1);
		System.out.println(e.getProperty("likes"));

		DatastoreService datastore_2 = DatastoreServiceFactory.getDatastoreService();
		Transaction txn = datastore_2.beginTransaction();
		datastore_2.put(e);
		txn.commit();
		return e;
	}

	@ApiMethod(name= "Delete", httpMethod = HttpMethod.POST)
	public Entity Delete(Delete d) throws UnauthorizedException {

		if (d == null) {
			throw new UnauthorizedException("Invalid credentials");
		}

		DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();

		Key clePost = KeyFactory.createKey(d.getEntity(), d.getId());

		datastore.delete(clePost);

		return null;
	}

}
