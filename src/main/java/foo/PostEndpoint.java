package foo;

import java.util.Date;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Random;
import java.util.ArrayList;
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
import com.google.appengine.api.datastore.FetchOptions;
import com.google.appengine.api.datastore.Key;
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

@Api(name = "post_api",
     version = "v1",
     audiences = "834229904246-7e02hoftjchsgnkh2a1be93ao1u7ip4o.apps.googleusercontent.com",
  	 clientIds = "834229904246-7e02hoftjchsgnkh2a1be93ao1u7ip4o.apps.googleusercontent.com",
     namespace =
     @ApiNamespace(
		   ownerDomain = "tinygram-lucas.appspot.com",
		   ownerName = "tinygram-lucas.appspot.com",
		   packagePath = "")
     )
public class PostEndpoint {

	@ApiMethod(name = "getPost", path = "getPost", httpMethod=HttpMethod.GET)
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
	public Entity postMsg(User user, Post post) throws UnauthorizedException {

		if (user == null) {
			throw new UnauthorizedException("Invalid credentials");
		}

		DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();

		Query q = new Query("tinyUser").setFilter(new FilterPredicate("email", FilterOperator.EQUAL, user.getEmail()));
		PreparedQuery pq = datastore.prepare(q);
		Entity searchQueryResult = pq.asSingleEntity();

		List<String> receivers = new ArrayList<>();
		receivers = (List<String>)searchQueryResult.getProperty("followers");

		Entity e = new Entity("Post", Long.MAX_VALUE-(new Date()).getTime()+":"+user.getEmail());
		e.setProperty("owner", user.getEmail());
		e.setProperty("url", post.url);
		e.setProperty("body", post.body);
		e.setProperty("likes", 0);
		e.setProperty("date", new Date());
		e.setProperty("receivers", receivers);

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

	@ApiMethod(name = "getTimeline", path = "getTimeline", httpMethod = HttpMethod.GET)
	public CollectionResponse<Entity> getTimeline(User user, @Nullable @Named("next") String cursorString) throws UnauthorizedException {

		if (user == null) {
			throw new UnauthorizedException("Invalid credentials");
		}

		DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();

		Query timelineQuery = new Query("Post").setFilter(new FilterPredicate("receivers", FilterOperator.EQUAL, user.getEmail()));
		PreparedQuery timelinePreparedQuery = datastore.prepare(timelineQuery);
		FetchOptions fetchOptions = FetchOptions.Builder.withLimit(5);

		if (cursorString != null) {
            fetchOptions.startCursor(Cursor.fromWebSafeString(cursorString));
            QueryResultList<Entity> results = timelinePreparedQuery.asQueryResultList(fetchOptions);
            cursorString = results.getCursor().toWebSafeString();

            return CollectionResponse.<Entity>builder().setItems(results).setNextPageToken(cursorString).build();
		} else {
            return CollectionResponse.<Entity>builder().setItems(timelinePreparedQuery.asQueryResultList(fetchOptions)).build();
        }
	}
}
