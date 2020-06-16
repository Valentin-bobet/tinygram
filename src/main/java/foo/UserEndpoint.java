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

@Api(name = "user_api",
     version = "v1",
     audiences = "834229904246-7e02hoftjchsgnkh2a1be93ao1u7ip4o.apps.googleusercontent.com",
  	 clientIds = "834229904246-7e02hoftjchsgnkh2a1be93ao1u7ip4o.apps.googleusercontent.com",
     namespace =
     @ApiNamespace(
		   ownerDomain = "tinygram-lucas.appspot.com",
		   ownerName = "tinygram-lucas.appspot.com",
		   packagePath = "")
     )
public class UserEndpoint {

    @ApiMethod(name = "getSearchUser", path="getSearchUser", httpMethod = HttpMethod.GET)
	public CollectionResponse<Entity> getSearchUser(User user, TinyUser tinyUser, @Named("search") String search, @Nullable @Named("next") String cursorString)
        throws UnauthorizedException {

        if (user == null) {
            throw new UnauthorizedException("Invalid credentials");
        }

		Query searchQuery = new Query("tinyUser").setFilter(
			new CompositeFilter(CompositeFilterOperator.OR, Arrays.asList(
				new FilterPredicate("email", FilterOperator.EQUAL, search),
				new FilterPredicate("firstName", FilterOperator.EQUAL, search),
				new FilterPredicate("lastName", FilterOperator.EQUAL, search),
				new FilterPredicate("name", FilterOperator.EQUAL, search),
				new FilterPredicate("invertedName", FilterOperator.EQUAL, search)
			))
		);

		DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
        PreparedQuery preparedSearchQuery = datastore.prepare(searchQuery);


        FetchOptions fetchOptions = FetchOptions.Builder.withLimit(10);

		if (cursorString != null) {
            fetchOptions.startCursor(Cursor.fromWebSafeString(cursorString));
            QueryResultList<Entity> results = preparedSearchQuery.asQueryResultList(fetchOptions);
            cursorString = results.getCursor().toWebSafeString();

            return CollectionResponse.<Entity>builder().setItems(results).setNextPageToken(cursorString).build();
		} else {
            return CollectionResponse.<Entity>builder().setItems(preparedSearchQuery.asQueryResultList(fetchOptions)).build();
        }
    }

    @ApiMethod(name = "getUser", path="getUser", httpMethod = HttpMethod.GET)
	public Entity getUser(User user, @Named("email") String email)
        throws UnauthorizedException {

        if (user == null) {
            throw new UnauthorizedException("Invalid credentials");
        }

        DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
        Query userQuery = new Query("tinyUser").setFilter(
				new FilterPredicate("email", FilterOperator.EQUAL, email)
				);
        PreparedQuery preparedUserQuery = datastore.prepare(userQuery);
        Entity tinyUser = preparedUserQuery.asSingleEntity();

        return tinyUser;
	}
}
