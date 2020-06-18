package endpoints;

import entities.*;

//import java.util.Date;
//import java.util.HashSet;
//import java.util.Iterator;
//import java.util.List;
//import java.util.Random;
//import java.util.Arrays;

import com.google.api.server.spi.auth.common.User;
import com.google.api.server.spi.config.Api;
import com.google.api.server.spi.config.ApiMethod;
import com.google.api.server.spi.config.ApiMethod.HttpMethod;
import com.google.api.server.spi.config.ApiNamespace;
//import com.google.api.server.spi.config.Named;
//import com.google.api.server.spi.config.Nullable;
//import com.google.api.server.spi.response.CollectionResponse;
import com.google.api.server.spi.response.UnauthorizedException;
//import com.google.api.server.spi.auth.EspAuthenticator;

//import com.google.appengine.api.datastore.Cursor;
import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.EntityNotFoundException;
//import com.google.appengine.api.datastore.FetchOptions;
import com.google.appengine.api.datastore.KeyFactory;
//import com.google.appengine.api.datastore.Key;
import com.google.appengine.api.datastore.Query;
import com.google.appengine.api.datastore.PreparedQuery;
//import com.google.appengine.api.datastore.PropertyProjection;
//import com.google.appengine.api.datastore.PreparedQuery.TooManyResultsException;
//import com.google.appengine.api.datastore.Query.CompositeFilter;
import com.google.appengine.api.datastore.Query.CompositeFilterOperator;
//import com.google.appengine.api.datastore.Query.Filter;
import com.google.appengine.api.datastore.Query.FilterOperator;
import com.google.appengine.api.datastore.Query.FilterPredicate;
//import com.google.appengine.api.datastore.Query.SortDirection;
//import com.google.appengine.api.datastore.QueryResultList;
import com.google.appengine.api.datastore.Transaction;
//import com.google.appengine.repackaged.com.google.common.io.CountingOutputStream;

@Api(name = "like_api", version = "1.0", audiences = "834229904246-7e02hoftjchsgnkh2a1be93ao1u7ip4o.apps.googleusercontent.com", clientIds = "834229904246-7e02hoftjchsgnkh2a1be93ao1u7ip4o.apps.googleusercontent.com", namespace = @ApiNamespace(ownerDomain = "tinygram-lucas.appspot.com", ownerName = "tinygram-lucas.appspot.com", packagePath = ""))
public class LikeEndpoint {

	@ApiMethod(name = "newLike", path = "newLike", httpMethod = HttpMethod.POST)
	public Entity newLike(User u, Like like) throws UnauthorizedException {

		if (u.getEmail() == null) {
			throw new UnauthorizedException("Invalid credentials");
		}

		DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();

		Query likeQuery = new Query("Like")
				.setFilter(CompositeFilterOperator.and(
					new FilterPredicate("Email", FilterOperator.EQUAL, u.getEmail()),
					new FilterPredicate("Post", FilterOperator.EQUAL, like.getPostLiked())
					)
				);

		PreparedQuery preparedLikeQuery = datastore.prepare(likeQuery.setKeysOnly());

		Entity likeQueryResult = preparedLikeQuery.asSingleEntity();

		if (likeQueryResult == null) {
			Entity e = new Entity("Like");
			e.setProperty("Email", u.getEmail());
			e.setProperty("Post", like.getPostLiked());

			Transaction likeInsertTransaction = datastore.beginTransaction();
			datastore.put(e);
			likeInsertTransaction.commit();
			Entity post;
			try {
				Transaction postAddLikeTransaction = datastore.beginTransaction();
				post = datastore.get(KeyFactory.createKey("Post", like.getPostLiked()));
				post.setProperty("likes", (Long) post.getProperty("likes")+1);
				datastore.put(post);
				postAddLikeTransaction.commit();
				return post;
			} catch (EntityNotFoundException e1) {
				// If the entity is not found we just log the error
				e1.printStackTrace();
				return e;
			}
		} else {
			datastore.delete(likeQueryResult.getKey());
			Entity post;
			try {
				Transaction postRemoveLikeTransaction = datastore.beginTransaction();
				post = datastore.get(KeyFactory.createKey("Post", like.getPostLiked()));
				if((Long)post.getProperty("likes")!=0) post.setProperty("likes", (Long)post.getProperty("likes")-1);
				datastore.put(post);
				postRemoveLikeTransaction.commit();
				return post;
			} catch (EntityNotFoundException e1) {
				// If the entity is not found we just log the error
				e1.printStackTrace();
				return null;
			}
		}
    }
}
