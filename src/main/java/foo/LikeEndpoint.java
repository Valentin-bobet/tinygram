package foo;

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

@Api(name = "like_api",
     version = "v1",
     audiences = "870442540848-fop7dnthuie202lpqh38os9i9n4phgv3.apps.googleusercontent.com",
  	 clientIds = "870442540848-fop7dnthuie202lpqh38os9i9n4phgv3.apps.googleusercontent.com",
     namespace =
     @ApiNamespace(
		   ownerDomain = "simple-basique-basique-simple.appspot.com",
		   ownerName = "simple-basique-basique-simple.appspot.com",
		   packagePath = "")
     )
public class LikeEndpoint {

	@ApiMethod(name= "newLike", path="newLike", httpMethod = HttpMethod.POST)
	public Entity newLike(User u, Like like) throws UnauthorizedException {

		if (u.getEmail() == null) {
			throw new UnauthorizedException("Invalid credentials");
		}

		DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();

	    Query searchQuery = new Query("like").setFilter(CompositeFilterOperator.and(
	    		new FilterPredicate("Email", FilterOperator.EQUAL, u.getEmail()),
	    		new FilterPredicate("Post", FilterOperator.EQUAL, like.getPostLiked())));

	    PreparedQuery preparedSearchQuery = datastore.prepare(searchQuery);

		List<Entity> searchQueryResult = preparedSearchQuery.asList(FetchOptions.Builder.withDefaults());

		if(searchQueryResult.isEmpty()) {
			Entity e = new Entity("like");
			e.setProperty("Email", u.getEmail());
			e.setProperty("Post", like.getPostLiked());

			DatastoreService datastore_2 = DatastoreServiceFactory.getDatastoreService();
			Transaction txn = datastore_2.beginTransaction();
			datastore_2.put(e);
			txn.commit();
			return e;
		}
		return null;
    }
}
