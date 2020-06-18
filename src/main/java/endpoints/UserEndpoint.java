package endpoints;

import entities.*;

//import java.util.Date;
//import java.util.HashSet;
//import java.util.Iterator;
import java.util.List;
//import java.util.Random;
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
//import com.google.api.server.spi.auth.EspAuthenticator;

import com.google.appengine.api.datastore.Cursor;
import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.EntityNotFoundException;
import com.google.appengine.api.datastore.FetchOptions;
//import com.google.appengine.api.datastore.Key;
import com.google.appengine.api.datastore.Query;
import com.google.appengine.api.datastore.PreparedQuery;
//import com.google.appengine.api.datastore.PropertyProjection;
//import com.google.appengine.api.datastore.PreparedQuery.TooManyResultsException;
import com.google.appengine.api.datastore.Query.CompositeFilter;
import com.google.appengine.api.datastore.Query.CompositeFilterOperator;
//import com.google.appengine.api.datastore.Query.Filter;
import com.google.appengine.api.datastore.Query.FilterOperator;
import com.google.appengine.api.datastore.Query.FilterPredicate;
//import com.google.appengine.api.datastore.Query.SortDirection;
import com.google.appengine.api.datastore.QueryResultList;
import com.google.appengine.api.datastore.Transaction;
//import com.google.appengine.repackaged.com.google.common.io.CountingOutputStream;

@SuppressWarnings("unchecked")
@Api(name = "user_api", version = "1.0", audiences = "834229904246-7e02hoftjchsgnkh2a1be93ao1u7ip4o.apps.googleusercontent.com", clientIds = "834229904246-7e02hoftjchsgnkh2a1be93ao1u7ip4o.apps.googleusercontent.com", namespace = @ApiNamespace( ownerDomain = "tinygram-lucas.appspot.com", ownerName = "tinygram-lucas.appspot.com", packagePath = ""))
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

    @ApiMethod(name= "createUser", path="createUser", httpMethod = HttpMethod.POST)
	public Entity createUser(User user, TinyUser tinyUser) throws UnauthorizedException {

		if (user == null) {
			throw new UnauthorizedException("Invalid credentials");
		}

		DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();

	    Query searchQuery = new Query("tinyUser").setFilter(
	    		new FilterPredicate("email", FilterOperator.EQUAL, tinyUser.email));

	    PreparedQuery preparedSearchQuery = datastore.prepare(searchQuery);

		List<Entity> searchQueryResult = preparedSearchQuery.asList(FetchOptions.Builder.withDefaults());

		if(searchQueryResult.isEmpty()) {
			Entity newTinyUser = new Entity("tinyUser");
			newTinyUser.setProperty("email", tinyUser.email);
			newTinyUser.setProperty("name", tinyUser.name);
			newTinyUser.setProperty("invertedName", tinyUser.invertedName);
			newTinyUser.setProperty("firstName", tinyUser.firstName);
			newTinyUser.setProperty("lastName", tinyUser.lastName);
			newTinyUser.setProperty("url", tinyUser.url);

			List<String> followers = new ArrayList<>();
			followers.add(user.getEmail());
			newTinyUser.setProperty("followers", followers);

			Transaction newTinyUserTransaction = datastore.beginTransaction();
			datastore.put(newTinyUser);
			newTinyUserTransaction.commit();
			return newTinyUser;
		}
		return null;
	}

	@ApiMethod(name= "followUser",path= "followUser", httpMethod = HttpMethod.POST)
	public Entity Follow(User user,Friendship friend) throws UnauthorizedException, EntityNotFoundException {

		if (user == null) {
			throw new UnauthorizedException("Invalid credentials");
		}

	    Query userQuery = new Query("tinyUser").setFilter(new FilterPredicate("email", FilterOperator.EQUAL, friend.getTargetUser()));

	    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();

	    PreparedQuery preparedUserQuery = datastore.prepare(userQuery);

		Entity userQueryResult = preparedUserQuery.asSingleEntity();

		if (((List<String>)userQueryResult.getProperty("followers")).contains(user.getEmail()) == false) {

			List<String> followers = new ArrayList<>();

			followers = (List<String>)userQueryResult.getProperty("followers");

			followers.add(user.getEmail());

			userQueryResult.setProperty("followers", followers);

			Transaction followTransaction = datastore.beginTransaction();
			datastore.put(userQueryResult);
			followTransaction.commit();
			return userQueryResult;
		}
		return null;
	}

	@ApiMethod(name= "unfollowUser",path= "unfollowUser", httpMethod = HttpMethod.POST)
	public Entity Unfollow(User user,Friendship friend) throws UnauthorizedException, EntityNotFoundException {

		if (user == null) {
			throw new UnauthorizedException("Invalid credentials");
		}

	    Query userQuery = new Query("tinyUser").setFilter(new FilterPredicate("email", FilterOperator.EQUAL, friend.getTargetUser()));

	    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();

	    PreparedQuery preparedUserQuery = datastore.prepare(userQuery);

		Entity userQueryResult = preparedUserQuery.asSingleEntity();

		if (((List<String>)userQueryResult.getProperty("followers")).contains(user.getEmail()) == true) {

			List<String> followers = new ArrayList<>();
			followers = (List<String>)userQueryResult.getProperty("followers");

			followers.remove(user.getEmail());

			userQueryResult.setProperty("followers", followers);

			Transaction unfollowTransaction = datastore.beginTransaction();
			datastore.put(userQueryResult);
			unfollowTransaction.commit();
			return userQueryResult;
		}
		return null;

	}
}
